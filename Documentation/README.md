# Documentation

## Lifecycles

Each Lifecycle is represented as a subfolder under `Lifecycles/`

For example [NextJS Github Repository](Lifecycles/NextJS%20Github%20Repository/) shows the replicable ordered sequence of steps taken when bootstrapping a NextJS app and storing the code in GitHub

### Lifecycle Stages Naming Convention

Lifecycle Stages are living documents that outline how I would take those steps again in the future

Lifecycle Stages begin in the Notes directory, collecting thoughts and example documentation, which are then committed first before executing the plan. A subsequent pull request will Graduate the Lifecycle

Graduated Lifecycle Stages follow this naming convention: `000x-<Topic>-<Tier>.md`, e.g. `0001-GitRepositories-Bare-Minimum.md`

- The `000x-` prefix is the order the steps either were actually executed, or how I'd execute them again in the future. These are living documents _actually executed_, so listing the folder by filename reads as the lifecycle itself. A step only gets a number once it's been run for real
- `<Topic>` is what's being set up (GitRepositories, NextJS, ...). Topics interleave within a folder - the numbering tracks execution order, not topic
- `<Tier>` is one of **Bare Minimum / Good / Better / Best** - each tier is a level up from the previous one for that topic. Every tier doc opens by explaining what that level up is, and carries all of its examples inline rather than referencing appendices

### Notes

[Lifecycles/Notes/](Lifecycles/Notes/) holds material for tiers that haven't been executed yet - unprefixed files like `GitRepositories-Better.md`. These are working notes, not finished docs. The intention is that each note is ultimately _deleted_: when its tier actually gets executed, the content graduates into a new `000x-` prefixed doc in the lifecycle folder and the note goes away. An empty `Notes/` folder means the backlog is clear
