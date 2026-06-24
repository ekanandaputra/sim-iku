import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse } from "../utils/response";
import { searchAuthUsers } from "../utils/authService";

export const getPics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // 1. Fetch users from Auth Service first
    const authResult = await searchAuthUsers(search, page, limit);

    if (!authResult) {
      // Auth service is down or failed, return empty
      return res.json(
        successResponse(
          { data: [], pagination: { page, limit, total: 0, totalPages: 0 } },
          "Successfully fetched PICs"
        )
      );
    }

    const { data: authUsers, pagination } = authResult;
    const userIds = authUsers.map((u) => u.id);

    if (userIds.length === 0) {
      return res.json(
        successResponse(
          { data: [], pagination },
          "Successfully fetched PICs"
        )
      );
    }

    // 2. Fetch assignments only for the retrieved userIds
    const ikuUsers = await prisma.ikuUser.findMany({
      where: { userId: { in: userIds } },
      include: { iku: { select: { id: true, code: true, name: true } } },
    });

    const componentUsers = await prisma.componentUser.findMany({
      where: { userId: { in: userIds } },
      include: {
        component: { select: { id: true, code: true, name: true } },
        prodi: { select: { id: true, name: true } },
      },
    });

    const bidangUsers = await prisma.bidangUser.findMany({
      where: { userId: { in: userIds } },
      include: {
        bidang: {
          include: {
            ikus: {
              include: { iku: { select: { id: true, code: true, name: true } } },
            },
            components: {
              include: {
                component: { select: { id: true, code: true, name: true } },
              },
            },
          },
        },
      },
    });

    // 3. Aggregate assignments
    const picMap = new Map<string, { ikus: Map<string, any>; components: Map<string, any> }>();

    const addPic = (userId: string) => {
      if (!picMap.has(userId)) picMap.set(userId, { ikus: new Map(), components: new Map() });
      return picMap.get(userId)!;
    };

    ikuUsers.forEach((iu) => {
      addPic(iu.userId).ikus.set(iu.iku.id, iu.iku);
    });

    componentUsers.forEach((cu) => {
      addPic(cu.userId).components.set(cu.component.id, {
        ...cu.component,
        prodi: cu.prodi || null,
      });
    });

    bidangUsers.forEach((bu) => {
      const pic = addPic(bu.userId);
      bu.bidang.ikus.forEach((bi) => pic.ikus.set(bi.iku.id, bi.iku));
      bu.bidang.components.forEach((bc) =>
        pic.components.set(bc.component.id, { ...bc.component, prodi: null })
      );
    });

    // 4. Map final response
    const pics = authUsers.map((user) => {
      const pic = picMap.get(user.id);
      const userIkus = pic ? Array.from(pic.ikus.values()) : [];
      const userComponents = pic ? Array.from(pic.components.values()) : [];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        ikus: userIkus,
        components: userComponents,
      };
    });

    res.json(
      successResponse(
        { data: pics, pagination },
        "Successfully fetched PICs"
      )
    );
  } catch (error) {
    next(error);
  }
};
