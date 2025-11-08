import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    hashedPassword: v.string(),
    salt: v.string(),
    createdAt: v.number(),
  }),
  teams: defineTable({
    name: v.string(),
    sport: v.string(),
    ownerId: v.string(),
    createdAt: v.number(),
    formation: v.optional(v.string()),
  }),
  players: defineTable({
    teamId: v.id('teams'),
    name: v.string(),
    position: v.string(),
    number: v.number(),
    isSubstitute: v.boolean(),
    formationPosition: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  }),
})
