import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updatePlayerAvatar = mutation({
  args: {
    playerId: v.id('players'),
    avatarStorageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Delete old avatar if it exists
    if (player.avatarStorageId) {
      await ctx.storage.delete(player.avatarStorageId);
    }

    await ctx.db.patch(args.playerId, {
      avatarStorageId: args.avatarStorageId,
    });
  },
});

export const getAvatarUrl = query({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const updatePlayer = mutation({
  args: {
    playerId: v.id('players'),
    name: v.string(),
    position: v.string(),
    number: v.number(),
    isSubstitute: v.boolean()
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    await ctx.db.patch(args.playerId, {
      name: args.name,
      position: args.position,
      number: args.number,
      isSubstitute: args.isSubstitute
    });
  }
});

export const updatePlayerPosition = mutation({
  args: {
    teamId: v.id('teams'),
    playerId: v.id('players'),
    position: v.object({
      x: v.number(),
      y: v.number()
    })
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    await ctx.db.patch(args.playerId, {
      formationPosition: args.position
    });
  }
});

export const togglePlayerSubstituteStatus = mutation({
  args: {
    playerId: v.id('players'),
    isSubstitute: v.boolean(),
    position: v.optional(v.object({
      x: v.number(),
      y: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const updateData: any = {
      isSubstitute: args.isSubstitute
    };

    if (args.position) {
      updateData.formationPosition = args.position;
    }

    await ctx.db.patch(args.playerId, updateData);
  }
});

export const deletePlayer = mutation({
  args: {
    playerId: v.id('players')
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    await ctx.db.delete(args.playerId);
  }
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    sport: v.string(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const teamId = await ctx.db.insert('teams', {
      name: args.name,
      sport: args.sport,
      ownerId: args.ownerId,
      createdAt: Date.now(),
    });
    return teamId;
  },
});

export const addPlayer = mutation({
  args: {
    teamId: v.id('teams'),
    name: v.string(),
    position: v.string(),
    number: v.number(),
    isSubstitute: v.boolean(),
    avatarStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert('players', {
      teamId: args.teamId,
      name: args.name,
      position: args.position,
      number: args.number,
      isSubstitute: args.isSubstitute,
      avatarStorageId: args.avatarStorageId,
    });
    return playerId;
  },
});

export const updateFormation = mutation({
  args: {
    teamId: v.id('teams'),
    formation: v.string(),
    playerPositions: v.array(
      v.object({
        playerId: v.id('players'),
        position: v.object({ x: v.number(), y: v.number() })
      })
    )
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    // First update the team's formation
    await ctx.db.patch(args.teamId, {
      formation: args.formation
    });

    // Then update each player's position
    for (const { playerId, position } of args.playerPositions) {
      const player = await ctx.db.get(playerId);
      if (!player) {
        console.error(`Player ${playerId} not found`);
        continue;
      }

      await ctx.db.patch(playerId, {
        formationPosition: position
      });
    }

    await ctx.db.patch(args.teamId, {
      formation: args.formation
    });

    for (const { playerId, position } of args.playerPositions) {
      const player = await ctx.db.get(playerId);
      if (player) {
        await ctx.db.patch(playerId, {
          formationPosition: position
        });
      }
    }
  }
});

export const getTeams = query({
  args: {
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('teams')
      .filter((q) => q.eq(q.field('ownerId'), args.ownerId))
      .collect();
  },
});

export const getTeamPlayers = query({
  args: {
    teamId: v.id('teams'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('players')
      .filter((q) => q.eq(q.field('teamId'), args.teamId))
      .collect();
  },
});
