# Overengineered TODO App — Design Spec

## Goal

Build a demo-grade, visually impressive overengineered TODO app for filming a comedy YouTube video. The full end-to-end flow must work on camera: adding a task visibly cascades through 7 microservices, 4 databases, Kafka, a blockchain, and an AI pipeline. Simplified internals are acceptable — priority is "looks impressive on screen."

## Constraints

- Must run locally on a single machine via Kind (local Kubernetes)
- TypeScript/Node for all services
- Monorepo with npm workspaces
- No external accounts required to demo (API keys optional, fallbacks exist)
- Target: 16GB+ RAM machine

---

## Repository Structure

```
overengineered-todo/
├── packages/
│   └── shared/                  # Shared TypeScript types & event definitions
├── services/
│   ├── api-gateway/             # Express + routing to all services
│   ├── task-service/            # CRUD for tasks (Postgres)
│   ├── auth-service/            # JWT + refresh tokens (Redis)
│   ├── notification-service/    # Consumes events, sends emails
│   ├── analytics-service/       # Consumes events, logs metrics (TimescaleDB)
│   ├── ai-service/              # LLM prioritization + vector search
│   └── search-service/          # Elasticsearch for semantic search
├── blockchain/
│   └── contracts/               # Solidity smart contract + Hardhat config
├── frontend/                    # Next.js app
├── infra/
│   ├── k8s/                     # Kubernetes manifests (deployments, services, configmaps)
│   ├── docker/                  # Dockerfiles for each service
│   └── monitoring/              # Grafana dashboards + Prometheus config
├── docker-compose.yml           # Dev fallback (optional)
├── skaffold.yaml                # Build + deploy to local Kind cluster
└── package.json                 # Workspace root (npm workspaces)
```

---

## Services & Data Flow

### Event Cascade (add task)

```
User types "buy milk" → Next.js frontend
  → API Gateway (auth check via JWT)
    → Task Service (writes to Postgres, returns task ID)
      → Publishes "TaskCreated" event to Kafka
        ├── Notification Service → sends email via Mailhog
        ├── AI Service → calls LLM to reprioritize → publishes "PrioritiesUpdated"
        ├── Search Service → generates vector embedding, indexes in Elasticsearch
        ├── Analytics Service → writes metric to TimescaleDB
        └── Blockchain Service → mints NFT on local Hardhat chain
```

Completing a task triggers the same cascade with a "TaskCompleted" event.

### Service Table

| Service | Database | Port | Purpose |
|---------|----------|------|---------|
| API Gateway | None | 3000 | Routes + auth middleware |
| Task Service | Postgres | 3001 | CRUD, source of truth |
| Auth Service | Redis | 3002 | JWT issue/verify, refresh tokens |
| Notification Service | None | 3003 | Kafka consumer → Mailhog SMTP |
| AI Service | None (calls external API) | 3004 | LLM prioritization, vector embeddings |
| Search Service | Elasticsearch | 3005 | Semantic search via embeddings |
| Analytics Service | TimescaleDB | 3006 | Event metrics + Prometheus exporter |
| Blockchain Service | None (Hardhat RPC) | 3007 | Mints "ProofOfProductivity" NFTs |

### Kafka Topics

- `task.created`
- `task.completed`
- `task.deleted`
- `priorities.updated`

---

## Infrastructure

### Kind Cluster

- Single-node Kind cluster
- Each service: 3 replicas (overkill for comedy)
- ClusterIP services for inter-service communication
- API Gateway exposed via NodePort or Ingress at `localhost`

### Infrastructure Pods

| Component | Purpose | Deployment Method |
|-----------|---------|-------------------|
| Kafka (KRaft mode) | Event bus | Bitnami Helm chart |
| Postgres | Task storage | Single-pod StatefulSet |
| Redis | Auth sessions | Single-pod StatefulSet |
| TimescaleDB | Analytics metrics | Single-pod StatefulSet |
| Elasticsearch | Semantic search | Single-pod StatefulSet |
| Hardhat Node | Local blockchain | Custom Dockerfile |
| Mailhog | Fake SMTP + web UI | Deployment |
| Prometheus | Metrics scraping | Helm chart |
| Grafana | Dashboards | Helm chart (preconfigured) |

### Deployment Tooling

- Skaffold for build + deploy to Kind
- `skaffold dev` for hot-reload during development
- Low resource requests/limits so it runs on 16GB machines

---

## Frontend

### Next.js App

Pages:
- `/` — Login page (OAuth2 flow via auth service)
- `/tasks` — Main TODO list (add, complete, delete tasks)
- `/dashboard` — Analytics dashboard (embedded Grafana or custom charts)

Features:
- Real-time updates via WebSocket (tasks reorder live when AI reprioritizes)
- Toast notifications showing the cascade ("Task stored... AI prioritizing... Blockchain minting... Done!")
- Processing indicator showing each service responding — the "money shot" for video

Styling: Tailwind CSS. Clean and minimal — the comedy is in the backend absurdity, not ugly UI.

---

## AI & Search

### AI Service (dual mode)

1. **Real mode** — Sends task list to Claude/OpenAI API. Prompt: "Rank these tasks by urgency and life impact. Be opinionated and slightly judgmental."
2. **Fallback mode** — Returns pre-written funny responses when no API key is set. Hardcoded responses rotate for variety during filming.

### Vector Search

- Task creation: Search Service consumes `task.created` event, generates embedding (OpenAI embeddings API or local `all-MiniLM-L6-v2` via Node), stores in Elasticsearch as dense vector field
- Search endpoint (on Search Service): accepts natural language query → embeds → cosine similarity against stored vectors
- Demo: search "dairy products" → finds "buy milk"
- Fallback: TF-IDF or pre-computed embeddings when no API key available

---

## Blockchain

### Smart Contract — "ProofOfProductivity"

Solidity contract on local Hardhat node:
- `completeTask(string taskName, uint256 taskId)` — Mints a soulbound NFT with task name + timestamp
- `getCompletionHistory(address user)` — Returns all completed tasks
- Emits on-chain `TaskCompleted` event

### Blockchain Service Flow

1. Consumes `task.completed` from Kafka
2. Calls smart contract via ethers.js
3. Waits for tx confirmation (instant on Hardhat)
4. Publishes `blockchain.minted` event to Kafka with tx hash
5. Frontend displays tx hash as "proof of productivity"

---

## Monitoring & Alerting

### Prometheus

- Scrapes `/metrics` on each service (via `prom-client`)
- Metrics: request count, request duration histogram, error rate, active connections
- Kafka consumer lag
- Custom: `tasks_completed_total`

### Grafana Dashboards (pre-provisioned as JSON)

1. **System Overview** — All services' request rates, latencies, error rates
2. **Task Pipeline** — Task lifecycle across all services to blockchain mint
3. **Kafka** — Consumer lag, messages/sec, partition status
4. **K8s Cluster** — Pod status, CPU/memory, replica counts

### Alerting (faked)

- Notification service sends alert email to Mailhog when latency exceeds threshold
- No actual PagerDuty needed — looks real on camera via Mailhog inbox

---

## Developer Experience

### Makefile Commands

```bash
make setup          # Install deps, build images, create Kind cluster, deploy everything
make dev            # Start Skaffold dev loop with hot-reload
make demo           # Deploy in "demo mode" — stable, no hot-reload, optimized for filming
make teardown       # Destroy Kind cluster
make reset          # Wipe all task data for clean takes
make add-sample-tasks  # Seed 3-5 funny sample tasks
make show-cascade   # Add a task and tail all service logs simultaneously
make status         # Show table of what's up/down
```

### Environment

- `.env.example` with optional `CLAUDE_API_KEY` / `OPENAI_API_KEY`
- All infrastructure has health checks
- Fallback mode works with zero external dependencies

---

## Success Criteria

The app is "done" when:
1. `make demo` brings up the full system on a local Kind cluster
2. Adding a task in the UI triggers a visible cascade through all 7 services
3. Completing a task mints an NFT on the local blockchain
4. AI prioritization returns a response (real or fallback)
5. Semantic search finds tasks by meaning
6. Grafana dashboards show metrics ticking up with each action
7. The whole flow is demoable in a single terminal + browser window
