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

    // 1. Fetch direct assignments
    const ikuUsers = await prisma.ikuUser.findMany({
      include: { iku: { select: { id: true, code: true, name: true } } }
    });
    const componentUsers = await prisma.componentUser.findMany({
      include: {
        component: { select: { id: true, code: true, name: true } },
        prodi: { select: { id: true, name: true } }
      }
    });

    // 2. Fetch indirect assignments via Bidang
    const bidangUsers = await prisma.bidangUser.findMany({
      include: {
        bidang: {
          include: {
            ikus: { include: { iku: { select: { id: true, code: true, name: true } } } },
            components: { include: { component: { select: { id: true, code: true, name: true } } } }
          }
        }
      }
    });

    // 3. Aggregate all PICs
    const picMap = new Map<string, { ikus: Map<string, any>, components: Map<string, any> }>();

    const addPic = (userId: string) => {
      if (!picMap.has(userId)) picMap.set(userId, { ikus: new Map(), components: new Map() });
      return picMap.get(userId)!;
    };

    ikuUsers.forEach(iu => {
      addPic(iu.userId).ikus.set(iu.iku.id, iu.iku);
    });

    componentUsers.forEach(cu => {
      addPic(cu.userId).components.set(cu.component.id, { ...cu.component, prodi: cu.prodi || null });
    });

    bidangUsers.forEach(bu => {
      const pic = addPic(bu.userId);
      bu.bidang.ikus.forEach(bi => pic.ikus.set(bi.iku.id, bi.iku));
      bu.bidang.components.forEach(bc => pic.components.set(bc.component.id, { ...bc.component, prodi: null }));
    });

    let picUserIds = Array.from(picMap.keys());

    // 4. Fetch user details from auth service
    const userMap = await fetchAuthUsers(picUserIds);

    // 5. Apply Search Filter
    if (search) {
      const searchLower = search.toLowerCase();
      const searchMatchedUserIds = new Set<string>();

      for (const userId of picUserIds) {
        const user = userMap.get(userId);
        const pic = picMap.get(userId)!;
        
        let matches = false;

        // Check user name
        if (user && user.name && user.name.toLowerCase().includes(searchLower)) {
          matches = true;
        }

        // Check IKUs
        if (!matches) {
          for (const iku of pic.ikus.values()) {
            if (iku.name.toLowerCase().includes(searchLower) || iku.code.toLowerCase().includes(searchLower)) {
              matches = true;
              break;
            }
          }
        }

        // Check Components
        if (!matches) {
          for (const comp of pic.components.values()) {
            if (comp.name.toLowerCase().includes(searchLower) || comp.code.toLowerCase().includes(searchLower)) {
              matches = true;
              break;
            }
          }
        }

        if (matches) {
          searchMatchedUserIds.add(userId);
        }
      }

      picUserIds = picUserIds.filter(id => searchMatchedUserIds.has(id));
    }

    const total = picUserIds.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedUserIds = picUserIds.slice(skip, skip + limit);

    // 6. Map to final response
    const pics = paginatedUserIds.map(userId => {
      const user = userMap.get(userId);
      if (!user) return null;

      const pic = picMap.get(userId)!;
      let userIkus = Array.from(pic.ikus.values());
      let userComponents = Array.from(pic.components.values());

      // Filter inner arrays if user name doesn't match search but IKU/Component does
      if (search) {
        const searchLower = search.toLowerCase();
        const userMatches = user.name && user.name.toLowerCase().includes(searchLower);
        if (!userMatches) {
          userIkus = userIkus.filter(iku => 
            iku.name.toLowerCase().includes(searchLower) || iku.code.toLowerCase().includes(searchLower)
          );
          userComponents = userComponents.filter(comp => 
            comp.name.toLowerCase().includes(searchLower) || comp.code.toLowerCase().includes(searchLower)
          );
        }
      }

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
