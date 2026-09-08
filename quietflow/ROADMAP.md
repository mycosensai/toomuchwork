# QuietFlow — Implementation Roadmap

## Phase 0: Foundation (Week 1–2)
**Goal**: Auth, map, static camera list, basic density from public APIs

- [x] Next.js 16 project setup with TypeScript + Tailwind + pnpm
- [x] Core data models (Camera, RoadSegment, BusinessLocation, DensityObservation, UserPreference)
- [x] Zustand store for global state management
- [x] UI component library (Card, Badge, Button, Input, Toggle)
- [ ] Clerk/Supabase Auth integration
- [ ] Living Map with MapLibre GL (static camera markers + density legend)
- [ ] Camera list view with status indicators
- [ ] API routes: `/api/cameras`, `/api/density`, `/api/locations`
- [ ] Docker Compose for local PostgreSQL + PostGIS + Redis
- [ ] Deployment to Vercel (or self-hosted)

## Phase 1: Live Video Gateway (Week 3–4)
**Goal**: Multi-camera video grid with HLS/WebRTC playback

- [ ] HLS.js integration for live stream playback
- [ ] RTSP-to-HLS proxy server (Node.js or Go)
- [ ] Multi-camera grid view (2×2, 3×3, 4×4 layouts)
- [ ] Single-camera cinema mode with density overlay
- [ ] Stream health monitoring and graceful degradation
- [ ] Auto-detection of stale/offline streams
- [ ] WebSocket for real-time status updates

## Phase 2: Computer Vision Pipeline (Week 5–8)
**Goal**: YOLO-based vehicle counting on selected cameras + fusion layer

- [ ] YOLOv10n model training on traffic datasets
- [ ] ONNX Runtime inference server (FastAPI)
- [ ] ByteTrack multi-object tracking
- [ ] Zone-based vehicle counting
- [ ] Privacy blurring (face/plate)
- [ ] Density fusion engine (CV + API + satellite)
- [ ] Real-time density overlay on map
- [ ] Edge deployment option (Jetson)

## Phase 3: Business Density + Quiet Finder (Week 9–10)
**Goal**: Place-level density cards, quiet window predictions, notifications

- [ ] Business location density cards
- [ ] Parking-lot occupancy from satellite
- [ ] Quiet Finder with search and date/time picker
- [ ] "Leave Now?" score with plain-language recommendation
- [ ] Prediction engine (LightGBM/LSTM)
- [ ] Quiet window calendar view
- [ ] User-contributed quiet reports
- [ ] Notification system (push + in-app)

## Phase 4: Personalization + Insights (Week 11–12)
**Goal**: User history, outing logging, personal recommendations

- [ ] My Places (home, favorites, saved searches)
- [ ] Completed outing logging with calmness rating
- [ ] Weekly insights dashboard with charts
- [ ] Personalized quiet window recommendations
- [ ] Educational micro-content
- [ ] Outing celebration and progress tracking

## Phase 5: Hardening + Launch (Week 13–14)
**Goal**: Production readiness, security audit, legal review

- [ ] WCAG 2.2 AA accessibility audit and fixes
- [ ] OWASP ASVS Level 2 security review
- [ ] Load testing (1000+ concurrent users)
- [ ] Privacy legal review package
- [ ] Data retention policy implementation
- [ ] Prominent disclaimers and documentation
- [ ] Internationalization (i18n) framework
- [ ] Performance optimization for mobile

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Users who complete a low-density outing | > 40% of active users | Database query |
| Outing completion rate increase | +20% MoM for first 3 months | Cohort analysis |
| Counting accuracy (MAE) | < 3 vehicles/frame | Automated evaluation |
| CV inference latency | < 50ms (GPU), < 200ms (CPU) | Prometheus metrics |
| Stream uptime (core cameras) | > 99.5% | Health check system |
| Prediction MAE (15-min horizon) | < 0.25 density levels | Hold-out evaluation |
| Prediction MAE (2h horizon) | < 0.5 density levels | Hold-out evaluation |
| User rating ("helpful") | > 4.0 / 5.0 | In-app survey |
| Mobile page load | < 3s FCP | Lighthouse CI |
