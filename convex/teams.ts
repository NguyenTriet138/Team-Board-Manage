import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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
  },
  handler: async (ctx, args) => {
    const playerId = await ctx.db.insert('players', {
      teamId: args.teamId,
      name: args.name,
      position: args.position,
      number: args.number,
      isSubstitute: args.isSubstitute,
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
