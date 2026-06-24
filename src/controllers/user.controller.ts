import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { successResponse } from "../utils/response";
import { fetchAuthUsers } from "../utils/authService";

export const getPics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const ikuUsersList = await prisma.ikuUser.findMany({ select: { userId: true } });
    const compUsersList = await prisma.componentUser.findMany({ select: { userId: true } });

    let picUserIds = Array.from(new Set([
      ...ikuUsersList.map(u => u.userId),
      ...compUsersList.map(u => u.userId)
    ]));

    // Fetch all user details from auth service to apply name search and populate response
    const userMap = await fetchAuthUsers(picUserIds);

    if (search) {
      const matchedIkuUsers = await prisma.ikuUser.findMany({
        where: { iku: { name: { contains: search } } },
        select: { userId: true },
      });
      const matchedComponentUsers = await prisma.componentUser.findMany({
        where: { component: { name: { contains: search } } },
        select: { userId: true },
      });

      const searchMatchedUserIds = new Set([
        ...matchedIkuUsers.map(u => u.userId),
        ...matchedComponentUsers.map(u => u.userId),
      ]);

      // Add users whose name matches the search term
      for (const [userId, user] of userMap.entries()) {
        if (user && user.name && user.name.toLowerCase().includes(search.toLowerCase())) {
          searchMatchedUserIds.add(userId);
        }
      }

      picUserIds = picUserIds.filter(id => searchMatchedUserIds.has(id));
    }

    const total = picUserIds.length;
    const totalPages = Math.ceil(total / limit);

    const paginatedUserIds = picUserIds.slice(skip, skip + limit);

    const ikuUsers = await prisma.ikuUser.findMany({
      where: { userId: { in: paginatedUserIds } },
      include: {
        iku: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    const componentUsers = await prisma.componentUser.findMany({
      where: { userId: { in: paginatedUserIds } },
      include: {
        component: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        prodi: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const pics = paginatedUserIds.map(userId => {
      const user = userMap.get(userId);
      if (!user) return null;

      const userIkus = ikuUsers
        .filter(iu => iu.userId === userId)
        .map(iu => iu.iku);

      const userComponents = componentUsers
        .filter(cu => cu.userId === userId)
        .map(cu => ({
          ...cu.component,
          prodi: cu.prodi || null,
        }));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        ikus: userIkus,
        components: userComponents,
      };
    }).filter(Boolean);

    res.json(successResponse({ data: pics, pagination: { page, limit, total, totalPages } }, "Successfully fetched PICs"));
  } catch (error) {
    next(error);
  }
};
