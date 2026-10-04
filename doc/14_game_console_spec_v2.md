# **Software Architecture & Technical Requirements**

* **Project:** Game Management & Server Orchestration Web Console
* **Target Game Client Engine:** Unreal Engine 5.5+ (C++ Enhanced 2D)
* **Primary Feature Priority:** Live Matchmaking Adjustments & ELO Orchestration
* **Document Version:** 2.0.0 (Updated Baseline)

---

## **1. System Architecture Overview**
The updated ecosystem establishes a unified control plane. The Web Console serves as the operational command layer, interfacing asynchronously with active cloud-hosted Unreal Engine dedicated game servers via a Go-based API Gateway. To ensure minimal competitive lag in arcade fighting matches, player telemetry and queuing adjustments are processed entirely separate from game client visual ticks.

---

## **2. Unified Technology Stack Matrix**

| Layer | Technology Choice | Operational Rationale |
| :--- | :--- | :--- |
| **Frontend UI Console** | React.js / TypeScript (`.tsx`) | Enforces strict UI data contract verification via types; handles fast, asynchronous dashboard widget re-renders. |
| **Backend API Core** | Go (Golang) / Gin Framework | Provides extreme concurrency capacity, low latency overhead, and rapid scaling under heavy player match polling spikes. |
| **Client Game Engine** | Unreal Engine 5.5+ (C++ / PaperZD) | Delivers deterministic execution for pixel-accurate hitboxes and frame data, natively supporting complex story mode data logic via Enhanced Input & Asset Managers. |
| **Primary Database** | PostgreSQL (v16+) | Maintains rigid ACID compliance for secure administrative audit logs and transactional player account progressions. |
| **In-Memory State** | Redis Enterprise | Serves as ultra-low latency memory layer for transient matchmaking queues, active matchmaking pool tokens, and microsecond data cache. |
| **Transport Protocols** | WebSockets / gRPC / WebRTC | Ensures instant bidirectional operational sync between the client node, Go backend services, and management browser dashboard. |

---

## **3. Game Client & Story Architecture Specification**
To scale the game into a competitive fighter with an extensive, asset-heavy narrative/story module, the client layer is standardizing on Unreal Engine 5.5+ using C++.

* **Deterministic 2D Hitboxes:** Custom C++ math calculations override basic 3D capsule components, utilizing box-based coordinate geometry for pixel-perfect fight validations.
* **Story Mode Extensibility:** Leverages Unreal Data Assets and Behavior Trees to decouple story script dialogue, cinematics, and single-player AI states from the core fighting codebase.
* **Enhanced Asset Streaming:** Implements background chunk loading to seamlessly transition between interactive story sequences and high-performance arcade matching states without runtime hitches.

---

## **4. Prioritized Feature: Live Matchmaking Adjustments**
The console prioritizes high-speed matchmaking control and orchestration parameters above all other back-office modules.

### **4.1 Architecture of the Real-Time Matchmaking Pipeline**
Player clients connect to a dedicated Go queue matchmaking microservice via WebSockets. The console enables operators to alter parameters in real time without downtime.

* **Dynamic Expansion Metrics:** Administrative overrides allow operators to dynamically scale the acceptable player ELO rank delta range when regional queue times cross target maximum thresholds.
* **Live Telemetry Dashboard:** Renders active queuing times, cross-region matchmaking pools, and player bounce rates in the web frontend utilizing optimized React state layers.
* **Hot-Swapping Rulesets:** Go backends evaluate matchmaking rulesets stored in Redis cache. Adjusting parameters via the browser console triggers an automated cache update, refreshing matchmaking behaviors globally in under 500ms.

---

## **5. Deployment & Scalability Standards**
* **Isolated Container Architecture:** Every service module is deployed inside Alpine-based Docker environments to minimize security exposure.
* **Automatic Elastic Scale Targets:** Go API gateway layers automatically scale out micro-instances horizontally when standard instance CPU or memory boundaries cross a 75% baseline.

***
*CONFIDENTIAL - INTERNAL DEVELOPMENT USE ONLY*
