<div align="center">

# Darshan Kachare

### Software Engineer · Systems Design · AI Infrastructure · Platform Engineering

Building developer tools, AI platforms, and MCP infrastructure — independently and at
[NextGenAI Labs](https://github.com/nextgenai-labs).

[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://github.com/dsk-dev-ai)
[![Python](https://img.shields.io/badge/Python-3776ab?style=flat-square&logo=python&logoColor=white)](https://github.com/dsk-dev-ai)
[![Rust](https://img.shields.io/badge/Rust-dea584?style=flat-square&logo=rust&logoColor=white)](https://github.com/dsk-dev-ai)
[![LLM / RAG / AI Agents](https://img.shields.io/badge/LLM%20RAG%20AI%20Agents-6c8cff?style=flat-square)](https://github.com/dsk-dev-ai)
[![MCP](https://img.shields.io/badge/MCP-34d399?style=flat-square)](https://github.com/dsk-dev-ai/mcp-nexus)
[![Open Source](https://img.shields.io/badge/Open%20Source-24292e?style=flat-square)](https://github.com/dsk-dev-ai)

[GitHub](https://github.com/dsk-dev-ai) · [MCP Nexus site](https://dsk-dev-ai.github.io/mcp-nexus/) · [Sponsor](https://github.com/sponsors/dsk-dev-ai)

</div>

---

## Open source contributions

### Microsoft AgentRC — merged into `main`

Open-source contributor to `microsoft/agentrc`: contributed source code and tests for nested
workspace instruction generation and VS Code Batch Instructions. My original work (PRs #259 / #260)
was carried forward into #368 and #369 — with my contributor commits preserved and code-review fixes
applied — and both were merged into `main`.

- **PR #369** — [fix(instructions): deduplicate nested AGENTS.md content](https://github.com/microsoft/agentrc/pull/369) — merged **8 commits** into `main`
- **PR #368** — [fix(vscode): honor nested batch instructions](https://github.com/microsoft/agentrc/pull/368) — merged **3 commits** into `main`

Scope: nested `AGENTS.md` generation · root instruction-context propagation · content deduplication ·
heading normalization · VS Code Batch Instructions with `strategy: "nested"` · automated tests ·
review-driven correctness fixes.

### MDN Web Docs

Merged contributions to `mdn/content` — [Interface glossary page](https://github.com/mdn/content/pull/45399),
[nested grid example fix](https://github.com/mdn/content/pull/45326),
[WASM `min_u` documentation fix](https://github.com/mdn/content/pull/44763).

---

## Selected projects

| Project | Notes |
| --- | --- |
| [**MCP Nexus**](https://github.com/dsk-dev-ai/mcp-nexus) · [site](https://dsk-dev-ai.github.io/mcp-nexus/) | v1.0 — intelligent routing & discovery layer for MCP tools. Heuristic + fuzzy semantic + LLM-optional routers, intent overlay, policy engine, stdio + Streamable HTTP gateways, web dashboard, and a deterministic §31 benchmark (100 / 87.5 / 93.8, zero hard failures) enforced as a CI gate. |
| [**API Monitor SaaS**](https://github.com/dsk-dev-ai/api-monitor-saas) · [demo](https://api-monitor-saas-frontend.vercel.app) | Open-source uptime monitoring SaaS — HTTP health checks, response-time analytics, email alerts, public status pages. Next.js 14 + Express + Prisma + PostgreSQL, Dockerized. |
| [**GenomeAI**](https://github.com/dsk-dev-ai/GenomeAI) · [demo](https://genomeai.vercel.app) | Open-source genomics / bioinformatics platform — 18 free public science APIs, AI analysis (Gemini / Ollama), DAG + retry workflows, molecular visualization. FastAPI + Next.js. |
| [**HunterOS**](https://github.com/dsk-dev-ai/hunteros) | Repository intelligence platform — architecture analysis, security scanning, AI-assisted code review (monorepo, ~20 packages). |
| [**DevOS AI**](https://github.com/dsk-dev-ai/devos-ai) | CLI assistant for understanding codebases — explain, search, and debug with local LLMs. |
| [**algorithm-discovery-engine**](https://github.com/dsk-dev-ai/algorithm-discovery-engine) | Multi-language algorithm engine — Java / C++ / Rust tiers, cross-language benchmarks, and a local synthesizer that rediscovers classic algorithms. |
| [**dsk-packages**](https://github.com/dsk-dev-ai/dsk-packages) | Zero-dependency TypeScript libraries — [`@darshankachare/logger`](https://www.npmjs.com/package/@darshankachare/logger). |
| [**Terminal tools**](https://github.com/dsk-dev-ai?tab=repositories) | [loggit](https://github.com/dsk-dev-ai/loggit) · [tailr](https://github.com/dsk-dev-ai/tailr) · [ctx](https://github.com/dsk-dev-ai/ctx) · [repoarch](https://github.com/dsk-dev-ai/repoarch) · [artlab](https://github.com/dsk-dev-ai/artlab) — zero-dependency, PyPI-published utilities. |

---

## GitHub stats

![GitHub stats](https://github-readme-stats.vercel.app/api?username=dsk-dev-ai&show_icons=true&count_private=true&theme=tokyonight)
![Top languages](https://github-readme-stats.vercel.app/api/top-langs/?username=dsk-dev-ai&layout=compact&count_private=true&theme=tokyonight)

---

## Tech stack

| Area | Technologies |
| --- | --- |
| **Languages** | TypeScript · Python · JavaScript · SQL · Rust |
| **Backend** | Node.js · Express · FastAPI · Prisma · PostgreSQL |
| **Frontend** | React · Next.js · Tailwind CSS |
| **AI & ML** | LLMs · RAG · Embeddings · Vector Search · AI Agents · MCP |
| **Infrastructure** | Linux · Docker · GitHub Actions · NGINX |
| **Scientific** | Bioinformatics · Genomics · Research workflows |

---

## Currently

- Shipping [MCP Nexus](https://github.com/dsk-dev-ai/mcp-nexus) 1.x and MCP tooling for AI agents
- Contributing to open source — Microsoft AgentRC, MDN Web Docs
- Growing [NextGenAI Labs](https://github.com/nextgenai-labs)
- Preparing for **Google Summer of Code 2026**

---

> Design thoughtfully. Build reliably. Share openly.