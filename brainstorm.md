**What do I want from this project:**

1. Learn new technologies  
2. Brush up knowledge of used technologies  
3. Build high level coding project that stands out for big MNCs  
4. Get more job opportunities during current placement situation in college and current job market from this experience of building this full scale application project in my resume  
5. Fully understand every part of the project and gain experience and knowledge on the project end \-to-end  
6. Build something to ship to actual end users

**What are the milestones of functionality that I want:**

| Version | Core App Functionality |
| ----- | ----- |
| **MVP** | \- Single user system (basic auth \- email/password) \- Create short URL (slug generation) \- Redirect service (basic Node.js redirect) \- Track clicks (timestamp, IP) \- Basic analytics: total clicks per link \- Simple dashboard (list of links \+ click count) |
| **V1** | \- Multi-user authentication (JWT) \- Workspace support (user → multiple projects) \- Track metadata: country (GeoIP), device, referrer \- Charts dashboard (daily clicks, device split) \- Custom slug support \- REST APIs: /shorten, /stats/:slug, /links \- URL validation \+ duplicate handling |
| **V2** | \- Multi-tenant architecture (workspace isolation using Supabase RLS) \- Role-based access (admin/member) \- UTM builder (campaign tracking links) \- Custom domains (bring your own domain) \- Edge redirect (Vercel Edge / AWS CloudFront) \- Performance optimization (\<50ms redirects) \- Materialized views for fast analytics |
| **V3** | \- AI UTM suggestions (analyze URL/content → suggest campaign tags) \- AI analytics summary (“best performing day/device”) \- Advanced filters (date range, geo, device) \- Export analytics (CSV/JSON) \- Rate limiting & abuse protection \- Link expiration & password-protected links |
| **Later** | \- Real-time analytics (WebSockets / live dashboard) \- A/B testing for links \- QR code generator for links \- Team activity logs \- Slack/Email notifications for spikes \- Billing system (Stripe integration for SaaS plans) |
| **Not in scope** | \- Full marketing automation platform \- Ad campaign management \- Complex ML prediction models \- Enterprise SSO (SAML, Okta) \- Data warehouse-level analytics |

