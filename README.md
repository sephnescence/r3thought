# R3thought

Rethought Version 3! My be all and end all personal knowledge management system, where the original Rethought is just a subset of features

Moving away from my original naming of Suite, Storey, and Space, I'll give it the "R" treatment. Realm, Residence, and Room. There might be a bonus fourth level called "Recess"

Idea for searching with a command palette: allow for `r1:<Realm Name>` as an alias for `realm:<Realm Name>`. Same for `r2`, `r3`, etc.

This will be hosted on Vercel, with Redis on Upstash, Postgres on Neon

It will use Clerk for authentication, and basically be set in beta mode forever with self-signups turned off

This is a monorepo by design, aiming to utilise several other private TS packages (via Nx) that are not to be published to npm. My package manager of choice is pnpm
