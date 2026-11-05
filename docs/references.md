# Research register

Consulted 5 November 2026. Product recommendations are project design judgments; cited research and vendor documentation do not validate this application. Service quotas and pricing must be rechecked at provisioning. Article-linked raw sources have not been verified by this design exercise.

| ID | Primary source | Used for |
| --- | --- | --- |
| R1 | [Founder Journey Planner — Nissan Dookeran](https://www.reddi.ai/blog/founder-journey-planner-australian-digital-economy) | Conceptual starting point, historical verification date and bibliography recovery |
| R2 | [Qdrant: Create a cluster](https://qdrant.tech/documentation/cloud/create-cluster/) | Free cluster capacity, inactivity policy and sizing overhead |
| R3 | [Neo4j Aura quotas and limits](https://neo4j.com/docs/aura/quotas-and-limits/) | Free graph limits and availability |
| R4 | [Neo4j instance actions](https://neo4j.com/docs/aura/managing-instances/instance-actions/) | Pause/resume/deletion behaviour; note that wording in FAQ may differ, so confirm console policy |
| R5 | [LangGraph.js overview](https://docs.langchain.com/oss/javascript/langgraph/overview) and [persistence documentation source](https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/persistence.mdx) | Workflow responsibilities and explicit persistence architecture |
| R6 | [Vercel Functions limits](https://vercel.com/docs/functions/limitations) | Request/runtime constraints; application deadlines are separately chosen |
| R7 | [Vercel Hobby](https://vercel.com/docs/plans/hobby) and [fair use](https://vercel.com/docs/limits/fair-use-guidelines) | Personal/non-commercial deployment boundary |
| R8 | [Ragas metrics](https://docs.ragas.io/en/latest/concepts/metrics/available_metrics/) and [faithfulness definition](https://github.com/vibrantlabsai/ragas/blob/main/docs/concepts/metrics/available_metrics/faithfulness.md) | Separate retrieval, support and factual evaluation |
| R9 | [Zheng et al., Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) | Judge limitations, including order, verbosity and self-preference |
| R10 | [X developer platform](https://developer.x.com/) and [official search documentation source](https://github.com/xdevplatform/docs/blob/main/x-api/posts/search/introduction.mdx) | Access/cost checks and reproducible question sampling |
| R11 | [Amershi et al., Guidelines for Human–AI Interaction](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/) | Capability communication, correction and user control |
| R12 | [Google PAIR: Explainability and Trust](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/) | Calibrated reliance and understandable explanations |
| R13 | [Google Research: Generative UI](https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/) | Rich task-specific interface research and its evaluation limitations |
| R14 | [Google Developers: Introducing A2UI](https://developers.googleblog.com/en/introducing-a2ui-an-open-project-for-agent-driven-interfaces/) | Declarative interface direction; not a dependency commitment |
| R15 | [Lindley et al., What does Generative UI mean for HCI Practice?](https://www.microsoft.com/en-us/research/publication/what-does-generative-ui-mean-for-hci-practice/) | Emerging design questions; workshop framing rather than validated universal practice |
| R16 | [Google Design: Speaking the Same Language](https://design.google/library/speaking-the-same-language-vui) | Brief, relevant spoken interaction |
| R17 | [W3C: Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/understanding/) | Accessible equivalents, interaction and audio controls |

No X post is cited as a discovered popular question or as a reference answer. Add post-level provenance only after a permitted, reproducible collection has been performed.


## API-first architecture references

Checked 5 November 2026. These document supported mechanisms; the detailed security and API requirements in ADR 001 are project design decisions.

| ID | Primary source | Used for |
| --- | --- | --- |
| R18 | [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables) and [next.config.js env](https://nextjs.org/docs/pages/api-reference/config/next-config-js/env) | Keep the BFF credential out of browser bundles and public configuration |
| R19 | [NestJS authentication](https://docs.nestjs.com/security/authentication) and [authorisation](https://docs.nestjs.com/security/authorization) | Enforce consumer authentication and route/service policies |
| R20 | [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction) | Generate and verify API contracts |
| R21 | [NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs) | Separate serverless API deployment; function constraints still apply |
| R22 | [MCP HTTP authorisation](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) | Future interoperable remote access; OAuth discovery and resource-bound credentials |


## Bounded decision-model references

Checked 5 November 2026. These establish provider capabilities only; the task vocabulary, policies, evaluation gates and budgets in ADR 002 are project choices. Verify current model IDs, account access and SDK limits before live implementation; no advertised speed/calibration figure is treated as a project result.

| ID | Primary source | Used for |
| --- | --- | --- |
| R23 | [TypeSafe introduction](https://docs.typesafe.ai/introduction) | Jev typed questions, choice distributions and separate confidence semantics |
| R24 | [OpenAI Decisions guide](https://developers.openai.com/api/docs/guides/decisions) | Dedicated decision endpoint, bounded answer types, current model support, refusal and usage mapping |
| R25 | [Vercel Decisions API integration](https://vercel.com/changelog/openai-decisions-api-now-available-on-ai-gateway) | Optional gateway transport and distinction between direct and gateway model identifiers |
