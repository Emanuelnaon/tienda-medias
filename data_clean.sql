SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict rX3oS3yR84bDzR2keLJZ8Wa8uFWN6DcP2e4J65kmuKze3xwtkXhsdFP0Jt4awA4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
350102fe-4a91-4312-b946-203c63facf00	996bd19d-a0ee-4c2b-b83b-8194f6d84424	de528882-8eda-4a65-8b9f-967960192cdc	s256	2RR3gwUAPzFpU21d2W6PIFqSf3ngHCHMmklRi0ljBA0	email			2026-08-01 22:32:50.034705+00	2026-08-01 22:33:00.428774+00	email/signup	2026-08-01 22:33:00.428723+00	\N	\N	\N	\N	f
6f1d247a-a80c-4275-98a2-e8f841f0eeb9	996bd19d-a0ee-4c2b-b83b-8194f6d84424	e6480818-1553-4de5-8649-4cffff269abb	s256	6wTyXij4swYihrIM2zOPSGmkM14h9YEuKx8_RiDFuPY	magiclink			2026-08-08 21:17:35.38838+00	2026-08-08 21:17:35.38838+00	magiclink	\N	\N	\N	\N	\N	f
af413439-454e-42ca-8698-47153649091d	996bd19d-a0ee-4c2b-b83b-8194f6d84424	e71e57b2-ca6b-4196-90c7-26e08a7c698a	s256	nxLOx-kBGhJSZZvAguGOOGAyUeJJI3BtspjwBF1MC1U	magiclink			2026-08-12 00:38:31.939083+00	2026-08-12 00:38:31.939083+00	magiclink	\N	\N	\N	\N	\N	f
1f649381-0a07-4b60-a741-89202a9768bf	996bd19d-a0ee-4c2b-b83b-8194f6d84424	75b390cc-7e1a-4b99-b29e-0bb18980bcb4	s256	GWKCRp8w9NOwD21WkVxIl49d2tUJFycPRxbd6LWupjk	magiclink			2026-08-12 01:54:54.251221+00	2026-08-12 01:54:54.251221+00	magiclink	\N	\N	\N	\N	\N	f
cd1c091e-592a-4fa0-b37f-9a87909b3f32	996bd19d-a0ee-4c2b-b83b-8194f6d84424	9f13cd8e-6089-41cf-9a56-969aa59d3393	s256	LzvuHi6COGNAQYzy9fhCYi9vTfsvFjClwyaaf6KRyoQ	magiclink			2026-08-12 02:00:29.286523+00	2026-08-12 02:00:29.286523+00	magiclink	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	9fab00b8-c2c3-42aa-9cce-215806a22146	authenticated	authenticated	subli.cat.insumos@gmail.com	$2a$10$EoyxmzltigDhYN5MBq0/Y.wjV90RuSYiUdwkwo0yzyzr6ukUg8IZ6	2026-08-16 20:08:41.787636+00	\N		\N		\N			\N	2026-11-09 21:55:57.932044+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-08-16 20:08:41.779511+00	2026-11-10 18:36:41.060361+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	996bd19d-a0ee-4c2b-b83b-8194f6d84424	authenticated	authenticated	emanuelnaon@gmail.com	$2a$06$CY7GAXzkj23QwjpBBfM1h.2mY.cnyPYEmlLu6F7xbBRQmTQFb3UuS	2026-08-01 22:33:00.423353+00	\N		2026-08-01 22:32:50.03661+00	pkce_136ca69660ecd6028ecfc08eb6abf374b2887df823faaa30fa82e585	2026-08-12 02:00:29.299029+00			\N	2026-10-10 22:19:13.648393+00	{"provider": "email", "providers": ["email"]}	{"sub": "996bd19d-a0ee-4c2b-b83b-8194f6d84424", "email": "emanuelnaon@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-08-01 22:32:50.022451+00	2026-10-10 22:19:13.658546+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
996bd19d-a0ee-4c2b-b83b-8194f6d84424	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{"sub": "996bd19d-a0ee-4c2b-b83b-8194f6d84424", "email": "emanuelnaon@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-08-01 22:32:50.030421+00	2026-08-01 22:32:50.030471+00	2026-08-01 22:32:50.030471+00	a71a6735-9a76-4e3b-b061-fdf52f86f9b2
9fab00b8-c2c3-42aa-9cce-215806a22146	9fab00b8-c2c3-42aa-9cce-215806a22146	{"sub": "9fab00b8-c2c3-42aa-9cce-215806a22146", "email": "subli.cat.insumos@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-08-16 20:08:41.785955+00	2026-08-16 20:08:41.786007+00	2026-08-16 20:08:41.786007+00	1dd50dcb-d68d-4c24-beef-7fbdd18d0a5a
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
2b246330-5156-4483-91c7-297867097117	9fab00b8-c2c3-42aa-9cce-215806a22146	2026-11-09 21:55:57.932599+00	2026-11-10 18:36:41.07311+00	\N	aal1	\N	2026-11-10 18:36:41.072999	Vercel Edge Functions	15.229.250.163	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
2b246330-5156-4483-91c7-297867097117	2026-11-09 21:55:57.982657+00	2026-11-09 21:55:57.982657+00	password	211fb11f-7603-4137-b7e2-94200dc24168
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_recovery_code_sets" ("id", "user_id", "mfa_factor_id", "failed_verification_count", "verification_locked_until", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_recovery_codes" ("id", "mfa_recovery_code_set_id", "code_hash", "consumed_at", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at", "expires_at") FROM stdin;
d1772480-6891-4497-9403-4b18254e92dc	996bd19d-a0ee-4c2b-b83b-8194f6d84424	recovery_token	pkce_136ca69660ecd6028ecfc08eb6abf374b2887df823faaa30fa82e585	emanuelnaon@gmail.com	2026-08-12 02:00:30.168288	2026-08-12 02:00:30.168288	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	152	utold2tg4w3a	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-09 21:55:57.952466+00	2026-11-09 22:54:03.562924+00	\N	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	153	kjzvk4lqit3u	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-09 22:54:03.579035+00	2026-11-10 00:51:02.54031+00	utold2tg4w3a	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	154	qn4n5fjmnrkj	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-10 00:51:02.551039+00	2026-11-10 01:59:08.839601+00	kjzvk4lqit3u	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	155	ky2uywuejzgz	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-10 01:59:08.854218+00	2026-11-10 05:21:02.207833+00	qn4n5fjmnrkj	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	156	ypojw2z66lp2	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-10 05:21:02.218665+00	2026-11-10 06:33:08.562042+00	ky2uywuejzgz	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	157	quahvxl3dxqk	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-10 06:33:08.571265+00	2026-11-10 15:54:58.822191+00	ypojw2z66lp2	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	158	6oep7x4eavex	9fab00b8-c2c3-42aa-9cce-215806a22146	t	2026-11-10 15:54:58.836449+00	2026-11-10 18:36:41.044132+00	quahvxl3dxqk	2b246330-5156-4483-91c7-297867097117
00000000-0000-0000-0000-000000000000	159	vsp2dduzjv3l	9fab00b8-c2c3-42aa-9cce-215806a22146	f	2026-11-10 18:36:41.055424+00	2026-11-10 18:36:41.055424+00	6oep7x4eavex	2b246330-5156-4483-91c7-297867097117
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."scim_tokens" ("id", "sso_provider_id", "token_hash", "prefix", "created_at", "expires_at", "revoked_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."scim_users" ("id", "sso_provider_id", "user_id", "resource", "created_at", "updated_at", "deleted_at") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tenants" ("id", "nombre", "slug", "plan", "whatsapp", "email", "activo", "created_at", "cbu", "alias_bancario", "banco", "titular_cuenta", "meta_pixel_id", "instagram_usuario") FROM stdin;
b0749fbd-74a9-48a4-b92f-6df33bc59e0c	Socks Store	default	basico	+5491172396962		t	2026-09-19 19:59:40.187817+00	1122334455667788991230	prueba	falso	prueba	\N	\N
\.


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."admin_users" ("id", "email", "whatsapp", "role", "tenant_id") FROM stdin;
996bd19d-a0ee-4c2b-b83b-8194f6d84424	emanuelnaon@gmail.com	5491128555582	webmaster	\N
9fab00b8-c2c3-42aa-9cce-215806a22146	subli.cat.insumos@gmail.com	+5491172396962	admin	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."categorias" ("id", "nombre", "slug", "padre_id", "es_preset", "created_at", "tenant_id") FROM stdin;
d6fc5f35-bcf6-4626-9683-5ffedba49c6a	Indumentaria	indumentaria	\N	t	2026-09-05 01:02:38.293181+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
3072e766-4663-4bb0-83de-fe61dfbd6ccc	Calzado	calzado	\N	t	2026-09-05 01:02:38.293181+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
e1259ca7-b96f-4af5-adad-b2b5d8337f1f	Bazar & Hogar	bazar-hogar	\N	t	2026-09-05 01:02:38.293181+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
713b8086-ed42-459d-8729-82d5da5646ff	Juguetería & Peluches	jugueteria-peluches	\N	t	2026-09-05 01:02:38.293181+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
a32d4f2d-88d1-4f63-abfe-846a37286218	Accesorios	accesorios	\N	t	2026-09-05 01:02:38.293181+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
6591173c-9bab-4aec-82ee-289e61fdeb50	Buzos	buzos	\N	f	2026-09-20 01:57:02.435142+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
b5afa9d1-45f0-44ee-b6c4-18b615cd6762	Tazas	tazas	\N	f	2026-09-20 01:57:02.435142+00	b0749fbd-74a9-48a4-b92f-6df33bc59e0c
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."clientes" ("id", "created_at", "nombre_completo", "telefono", "email", "estado", "total_gastado", "cantidad_pedidos", "notas", "tenant_id", "bloqueado") FROM stdin;
79e239b7-8f36-4816-8dfb-d884267329c9	2026-09-28 00:03:26.236207+00	otrom	+5491112345679	\N	verificado	1000.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
0f3a02e3-761f-43b1-82c8-7c1eb57984da	2026-11-07 20:56:21.832463+00	sietedelonce	1100000003	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
509e5860-afb0-4491-b14d-8d99f81bdf6a	2026-11-08 20:10:02.62828+00	Ochodelonce	1100000004	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
03f91847-e360-4d52-8a31-104e71bd66e6	2026-11-08 20:46:09.394431+00	TstwithRevoke	1100000005	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
fc6cac6f-b6f5-4d63-9f5d-6b88cea97131	2026-11-08 20:08:48.845824+00	Motog56	1128555588	\N	verificado	1500.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
0d40a5d7-fd9a-434c-975e-a515e3c1622b	2026-11-09 04:51:49.692589+00	Emanuel2	1161302667	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
a52dbf6a-a4b1-41f3-ade5-691de3284bf7	2026-11-09 19:07:15.084256+00	Nuevedelonce	1100000006	\N	verificado	12500.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
11a96b02-433a-4d39-a050-3c470f47bba5	2026-11-09 21:55:44.64311+00	PruebaDelivery	1100000007	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
c4ddeb55-31dc-43b6-89a4-7aca88e29109	2026-09-28 00:48:49.734365+00	roxy22	1122559999	\N	verificado	1000.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
16f7f3ab-cc1f-40be-98dd-c2be7ee1f8bb	2026-10-04 22:16:50.080921+00	dbz	1125200000	\N	verificado	10000.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
ff73b3d1-22cb-41bf-ad0b-feb4e4c20f9b	2026-11-05 17:19:49.168647+00	ultimo	1172396962	\N	verificado	40500.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
fa68643e-877c-45ce-ac2c-d36dfcbf8bdc	2026-11-05 17:36:23.622352+00	roxy	01128555588	\N	verificado	19000.00	1	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
9bba3705-5470-4a9b-a899-b61565cfd675	2026-11-06 04:00:41.013035+00	emanuelzz	1124612358	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
6f637e44-c1a9-47a7-9de8-30a541a48893	2026-11-06 04:16:22.641965+00	zod	1179548123	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
06994358-7007-4dc8-b476-6e210248b602	2026-11-06 06:23:26.473929+00	chat	1194759565	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
f7c47634-0c95-4f07-a8e6-dd3e8de5281e	2026-11-06 09:06:13.951613+00	otrassss	1123963594	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
d1804bfc-d365-4753-b049-a5b96ff0b062	2026-11-06 09:09:22.343+00	loren	1177487595	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
b1f15731-89ec-4e4b-ac40-24f970c0ca2e	2026-11-06 09:10:26.165781+00	susu	1164754683	\N	verificado	0.00	0	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	f
\.


--
-- Data for Name: zonas_envio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."zonas_envio" ("id", "tenant_id", "nombre", "codigo_postal_desde", "codigo_postal_hasta", "metodo", "costo", "minimo_envio_gratis", "activo", "created_at") FROM stdin;
ba6d836c-7210-4e38-bcd5-0cf19a0de9d2	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	moron	1722	1761	retiro	0.00	\N	t	2026-10-10 23:16:19.553983+00
4095efee-2481-496a-94c9-05a393c8978f	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	CABA	1000	1499	correo	9000.00	150000.00	t	2026-10-10 23:18:44.07939+00
0f3e53c0-45d1-4976-a979-ae58312ce0c0	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	merlo	1761	1761	retiro	0.00	\N	t	2026-10-10 22:59:08.010835+00
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos" ("id", "created_at", "cliente_id", "estado", "total", "comprobante_url", "tenant_id", "comprobante_numero", "metodo_envio", "zona_envio_id", "costo_envio", "codigo_postal", "direccion_entrega", "token_seguimiento", "nombre_contacto") FROM stdin;
05408e9b-9a7a-4a2d-a8d4-8c3d48d0f35f	2026-11-08 20:08:48.845824+00	fc6cac6f-b6f5-4d63-9f5d-6b88cea97131	confirmado	1500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	ea5a2d2f7c344f98b84fa4a846d79660a0e628f3f8ad436ab3c8ab42f717a0e0	Motog56
dc6a6194-a9d1-437a-8b45-c746ee20b799	2026-11-08 20:10:02.62828+00	509e5860-afb0-4491-b14d-8d99f81bdf6a	en_camino	10000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	35871294f4ed4538b740edbd89c37c1e4384aa832e504f668aef10b080eb42b0	Ochodelonce
22b612e4-e038-46ae-b08b-dd21051967d1	2026-11-09 04:51:49.692589+00	0d40a5d7-fd9a-434c-975e-a515e3c1622b	pendiente	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	43e225ef7dfe42248c8df1e4bb0f1fa0a0ae0ee333b24eca916bc7b2b5e7eea4	Emanuel2
29859b37-1cac-47fe-ad75-63734c0e8dcd	2026-11-06 04:00:41.319782+00	9bba3705-5470-4a9b-a899-b61565cfd675	confirmado	29000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
97ac4fcf-53fd-4659-95b9-ac047e997270	2026-11-05 17:19:49.314784+00	ff73b3d1-22cb-41bf-ad0b-feb4e4c20f9b	confirmado	40500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
5077eca1-2f0b-4db8-addc-969f86ca2694	2026-09-28 00:03:26.34031+00	79e239b7-8f36-4816-8dfb-d884267329c9	en_camino	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
79180c0f-4e6c-4ef5-a174-7f6cec9293b1	2026-11-09 19:07:15.084256+00	a52dbf6a-a4b1-41f3-ade5-691de3284bf7	entregado	12500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	edab8d3469ca485ab76b79ad6b3ba6a518b72b78d8334afa86de733fede6f0ab	Nuevedelonce
0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	2026-11-09 21:55:44.64311+00	11a96b02-433a-4d39-a050-3c470f47bba5	entregado	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	8e60cc607c5b4803b395db459f6a3528ed9e2286ca0248ae9d9c63438a420821	PruebaDelivery
640ab38c-f546-4405-8b8c-6d80025c2739	2026-11-07 20:56:22.123535+00	0f3a02e3-761f-43b1-82c8-7c1eb57984da	pendiente	10000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
65e03f66-9974-4675-8cff-9396303e0850	2026-11-08 20:46:09.394431+00	03f91847-e360-4d52-8a31-104e71bd66e6	entregado	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	678c423490aa42588ede635bc022524904e853b8e37d4e5fb7aa29c893afa778	TstwithRevoke
34f91bfc-08f8-478e-a058-1fa07fb9c6d8	2026-09-28 00:48:49.89788+00	c4ddeb55-31dc-43b6-89a4-7aca88e29109	confirmado	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
710bb0ed-c40b-4528-a1c7-1d16398ea036	2026-10-04 22:16:50.383757+00	16f7f3ab-cc1f-40be-98dd-c2be7ee1f8bb	confirmado	10000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
31f8ad19-4c8c-4ad7-bcd3-ec75401ef3a9	2026-11-05 17:36:23.780842+00	fa68643e-877c-45ce-ac2c-d36dfcbf8bdc	confirmado	19000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
253da103-6179-4fc0-a6f7-746c3ed8e11e	2026-11-06 04:16:22.922595+00	6f637e44-c1a9-47a7-9de8-30a541a48893	pendiente	13000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
50825e9d-f7ff-474d-8654-5fe7d7fb4b24	2026-11-06 06:23:26.612535+00	06994358-7007-4dc8-b476-6e210248b602	pendiente	1500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
0c374c42-271e-422f-8dad-af249187c4ba	2026-11-06 09:06:14.081119+00	f7c47634-0c95-4f07-a8e6-dd3e8de5281e	pendiente	31500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
6d8f4470-d5d4-45ad-aa85-89da230db192	2026-11-06 09:09:22.616077+00	d1804bfc-d365-4753-b049-a5b96ff0b062	pendiente	1500.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
c447ea31-590b-4b7f-8ef6-8e474ab30cae	2026-11-06 09:10:26.487217+00	b1f15731-89ec-4e4b-ac40-24f970c0ca2e	pendiente	1000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
5e98c82e-1a84-4ce4-bf5e-9e45200d0627	2026-10-10 23:19:10.70742+00	\N	cancelado	12000.00	\N	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	\N	\N	0.00	\N	\N	\N	\N
\.


--
-- Data for Name: delivery_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."delivery_tracking" ("id", "pedido_id", "tenant_id", "lat", "lng", "updated_at") FROM stdin;
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."productos" ("id", "nombre", "descripcion", "precio", "stock", "talles_disponibles", "imagen_url", "user_id", "created_at", "codigo_corto", "galeria_imagenes", "tenant_id", "categoria_id") FROM stdin;
7b0fcf92-055a-408d-95d8-ec85219016a1	taza con posa vasos DBZ	taza de Shenlong con posa vasos de las esferas	10000	11	{Único}	https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1791152079488-c8be2170-3e17-4156-8b02-02b2669bafd7-Taza_dragonBall_posaVasos.jpg	\N	2026-10-04 22:14:51.111819+00	1001	{https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1791152079488-c8be2170-3e17-4156-8b02-02b2669bafd7-Taza_dragonBall_posaVasos.jpg}	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	b5afa9d1-45f0-44ee-b6c4-18b615cd6762
9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	taza con nombre a eleccion	1500	10	{Único}	https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1788565728893-d3ijenkc2jl-taza_nombre_profe.jpg	\N	2026-09-04 23:49:09.944348+00	12	{https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1788565728893-d3ijenkc2jl-taza_nombre_profe.jpg}	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	b5afa9d1-45f0-44ee-b6c4-18b615cd6762
2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	buzo luffy wanted	1000	47	{XL,L,M,Único}	https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1787969036867-u23ho1ieb2-1b0dcc50c90c48a096055ae2eb371d3a.jpg	\N	2026-08-29 02:04:05.862557+00	10	{https://adauxoedgfvaadkvvifu.supabase.co/storage/v1/object/public/productos/1787969036867-u23ho1ieb2-1b0dcc50c90c48a096055ae2eb371d3a.jpg}	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	6591173c-9bab-4aec-82ee-289e61fdeb50
\.


--
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."producto_variantes" ("id", "producto_id", "talle", "stock", "sku", "created_at") FROM stdin;
23bf40de-3e28-4fc7-adb8-416ccb099c73	7b0fcf92-055a-408d-95d8-ec85219016a1	Único	11	\N	2026-10-04 22:14:51.560589+00
40da514d-181c-476f-8d6a-12c1f9868ef9	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	Único	10	\N	2026-09-04 23:49:10.38361+00
907b58ec-d224-4859-badd-3d46e6de53dc	2448d2a0-e259-4038-9e32-2172496c8040	Único	11	\N	2026-09-27 22:04:40.349125+00
b05ceee3-4eba-4b30-9f35-fc7fc8b07a1e	2448d2a0-e259-4038-9e32-2172496c8040	M	12	\N	2026-09-24 23:51:17.835763+00
9ada384c-1bb3-4a70-a4ef-6fefee6aa521	2448d2a0-e259-4038-9e32-2172496c8040	XL	12	\N	2026-09-24 23:51:17.835763+00
8c9beac2-6d35-476a-ba37-86687cbfe342	2448d2a0-e259-4038-9e32-2172496c8040	L	12	\N	2026-09-24 23:51:17.835763+00
\.


--
-- Data for Name: lista_espera; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lista_espera" ("id", "tenant_id", "producto_id", "variante_id", "email", "telefono", "created_at") FROM stdin;
\.


--
-- Data for Name: pedidos_historial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos_historial" ("id", "pedido_id", "tenant_id", "estado_anterior", "estado_nuevo", "changed_at", "changed_by", "origen", "notas") FROM stdin;
0fb35c21-7900-42bf-ad66-25d254cb6ea4	50825e9d-f7ff-474d-8654-5fe7d7fb4b24	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-06 06:23:26.612535+00	\N	sistema	\N
f3d3dc65-7892-4c96-afbc-6a51cd7c99a2	0c374c42-271e-422f-8dad-af249187c4ba	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-06 09:06:14.081119+00	\N	sistema	\N
cd5db8a9-6529-4e36-8990-1b02a737b189	6d8f4470-d5d4-45ad-aa85-89da230db192	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-06 09:09:22.616077+00	\N	sistema	\N
27e6b83c-2772-422a-a728-ac4e04eec06c	c447ea31-590b-4b7f-8ef6-8e474ab30cae	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-06 09:10:26.487217+00	\N	sistema	\N
c7313c01-77e1-4c2b-9f15-6e7bf9af424f	640ab38c-f546-4405-8b8c-6d80025c2739	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-07 20:56:22.123535+00	\N	sistema	\N
952488b5-9f3b-45de-bf1f-06c227c49ca7	05408e9b-9a7a-4a2d-a8d4-8c3d48d0f35f	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-08 20:08:48.845824+00	\N	sistema	\N
031a0d16-0509-4bb8-865c-48fed185308a	dc6a6194-a9d1-437a-8b45-c746ee20b799	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-08 20:10:02.62828+00	\N	sistema	\N
31dd6fe8-f973-41f5-be1b-54aa8b3f77b8	65e03f66-9974-4675-8cff-9396303e0850	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-08 20:46:09.394431+00	\N	sistema	\N
df505f51-97c8-48de-9088-9c11df3d3e74	65e03f66-9974-4675-8cff-9396303e0850	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-08 23:13:36.261829+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
d39905e0-c81d-4b83-85df-45deda762bdf	dc6a6194-a9d1-437a-8b45-c746ee20b799	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-08 23:19:41.98908+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
c570a011-80df-4557-99d6-82f8a5d980b6	65e03f66-9974-4675-8cff-9396303e0850	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	confirmado	preparando	2026-11-08 23:20:01.680135+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
bbedc6de-19fc-45e7-8f34-3074021d03d5	65e03f66-9974-4675-8cff-9396303e0850	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	preparando	en_camino	2026-11-08 23:20:07.85389+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
a0b253d1-cc1c-4b06-ae9f-4e6bf91735c6	65e03f66-9974-4675-8cff-9396303e0850	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	en_camino	entregado	2026-11-08 23:20:13.837961+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
b72c868b-8aad-4360-8a55-75e6a08ed895	05408e9b-9a7a-4a2d-a8d4-8c3d48d0f35f	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-08 23:29:24.232861+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
87fb5eb3-7357-454b-9999-e29a9417b62f	dc6a6194-a9d1-437a-8b45-c746ee20b799	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	confirmado	preparando	2026-11-08 23:29:40.552238+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
e75a978e-d2f6-4604-ad2e-2b8f88854421	dc6a6194-a9d1-437a-8b45-c746ee20b799	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	preparando	en_camino	2026-11-08 23:32:54.129969+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
6797b6bc-e383-4b79-bf4b-960fa8fa38d5	22b612e4-e038-46ae-b08b-dd21051967d1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-09 04:51:49.692589+00	\N	sistema	\N
41e8484d-5c2a-4e76-aa13-069905947067	29859b37-1cac-47fe-ad75-63734c0e8dcd	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-09 04:52:59.045363+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
90d57f7f-a60c-497b-afa8-cae9fd72f1d6	5077eca1-2f0b-4db8-addc-969f86ca2694	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	confirmado	preparando	2026-11-09 17:55:37.433787+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
90faca4f-4554-4afe-9d3f-188e8cf529f5	5077eca1-2f0b-4db8-addc-969f86ca2694	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	preparando	en_camino	2026-11-09 17:55:40.883852+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
f824715d-fb56-43a6-96c6-7183684b89f4	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-09 19:07:15.084256+00	\N	sistema	\N
07b57e4f-8d4e-4de9-b7ac-589cda5eb82a	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-09 19:08:46.212096+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
082d40ac-31b2-4c8d-9e59-b1a78e7a9382	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	confirmado	preparando	2026-11-09 19:09:06.699897+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
c8bcacbe-7507-499a-817a-db0deb5e8b3d	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	preparando	en_camino	2026-11-09 19:09:10.901379+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
a6006878-4597-4241-a7e2-b88109341478	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	en_camino	entregado	2026-11-09 21:39:36.8058+00	\N	sistema	\N
3f70c49c-3341-4a7c-b3c6-808fa0f12c95	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	\N	pendiente	2026-11-09 21:55:44.64311+00	\N	sistema	\N
314c3869-88fe-4188-af7c-81bf421cd623	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	pendiente	confirmado	2026-11-09 21:56:11.273203+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
fe043275-aa94-4989-a3e7-8b9a1a60cb5c	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	confirmado	preparando	2026-11-09 21:56:16.348397+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
e5365820-9420-4e63-81c0-14ff2871f0a0	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	preparando	en_camino	2026-11-09 21:56:20.929693+00	9fab00b8-c2c3-42aa-9cce-215806a22146	admin	\N
73267a81-b8ba-4ce2-935c-2d50ce4501f7	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	b0749fbd-74a9-48a4-b92f-6df33bc59e0c	en_camino	entregado	2026-11-09 22:05:37.076993+00	\N	sistema	\N
\.


--
-- Data for Name: pedidos_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pedidos_items" ("id", "pedido_id", "producto_id", "nombre_producto", "talle", "cantidad", "precio_unitario", "variante_id") FROM stdin;
e08966de-4b3c-43f1-b341-9a5b50b0b76d	640ab38c-f546-4405-8b8c-6d80025c2739	7b0fcf92-055a-408d-95d8-ec85219016a1	taza con posa vasos DBZ	Único	1	10000.00	\N
cc3237f6-9f0e-495a-ac05-3e3a7c872b41	05408e9b-9a7a-4a2d-a8d4-8c3d48d0f35f	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	Único	1	1500.00	40da514d-181c-476f-8d6a-12c1f9868ef9
7871cc40-e17b-405d-b476-a0182104a8f3	dc6a6194-a9d1-437a-8b45-c746ee20b799	7b0fcf92-055a-408d-95d8-ec85219016a1	taza con posa vasos DBZ	Único	1	10000.00	23bf40de-3e28-4fc7-adb8-416ccb099c73
bcf6ebc9-293c-4490-b6f1-7b186cdff807	65e03f66-9974-4675-8cff-9396303e0850	2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	Único	1	1000.00	907b58ec-d224-4859-badd-3d46e6de53dc
99aefb74-87a4-4117-8e7f-46ec9551166b	22b612e4-e038-46ae-b08b-dd21051967d1	2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	XL	1	1000.00	9ada384c-1bb3-4a70-a4ef-6fefee6aa521
2654f4a2-6859-4701-a9d7-c7c6f9cee74b	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	7b0fcf92-055a-408d-95d8-ec85219016a1	taza con posa vasos DBZ	Único	1	10000.00	23bf40de-3e28-4fc7-adb8-416ccb099c73
0de196ba-6d0c-4667-ad18-8779cec9c647	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	Único	1	1500.00	40da514d-181c-476f-8d6a-12c1f9868ef9
f1767fdd-9b68-4ccc-a911-7874add4d074	79180c0f-4e6c-4ef5-a174-7f6cec9293b1	2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	Único	1	1000.00	907b58ec-d224-4859-badd-3d46e6de53dc
0bf7772b-99d6-47af-a0e0-0dd497d6af3c	0afcd4eb-62c7-4e2f-8980-e1ba09abadb8	2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	Único	1	1000.00	907b58ec-d224-4859-badd-3d46e6de53dc
bf8d1723-3693-403c-aa9a-76b57b11c6f4	50825e9d-f7ff-474d-8654-5fe7d7fb4b24	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	Único	1	1500.00	\N
03f19f81-83e8-4522-bd30-0093441a6c4f	0c374c42-271e-422f-8dad-af249187c4ba	7b0fcf92-055a-408d-95d8-ec85219016a1	taza con posa vasos DBZ	Único	3	10000.00	\N
dfac0177-0fb5-45f9-8fb0-1ddf8ad96a06	0c374c42-271e-422f-8dad-af249187c4ba	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	Único	1	1500.00	\N
f5f17ffa-7fd8-436c-9025-9906fe8ba2d4	6d8f4470-d5d4-45ad-aa85-89da230db192	9a4f2ca0-075f-46a2-bc7f-6b606acea0e9	taza profe	Único	1	1500.00	\N
d5f8c9c5-19a3-4816-a6e6-0217095308ad	c447ea31-590b-4b7f-8ef6-8e474ab30cae	2448d2a0-e259-4038-9e32-2172496c8040	Buzo One Piece	Único	1	1000.00	\N
\.


--
-- Data for Name: plan_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."plan_features" ("plan", "feature_key", "enabled", "created_at") FROM stdin;
basico	catalogo	t	2026-09-19 19:59:40.187817+00
basico	carrito_whatsapp	t	2026-09-19 19:59:40.187817+00
basico	checkout_transferencia	t	2026-09-19 19:59:40.187817+00
basico	meta_pixel	f	2026-09-19 19:59:40.187817+00
basico	instagram_feed	f	2026-09-19 19:59:40.187817+00
basico	cotizador_dinamico	f	2026-09-19 19:59:40.187817+00
premium	catalogo	t	2026-09-19 19:59:40.187817+00
premium	carrito_whatsapp	t	2026-09-19 19:59:40.187817+00
premium	checkout_transferencia	t	2026-09-19 19:59:40.187817+00
premium	meta_pixel	t	2026-09-19 19:59:40.187817+00
premium	instagram_feed	t	2026-09-19 19:59:40.187817+00
premium	cotizador_dinamico	t	2026-09-19 19:59:40.187817+00
basico	crm_clientes	t	2026-09-26 00:08:03.235077+00
premium	crm_clientes	t	2026-09-26 00:08:03.235077+00
basico	payment_confirmation	t	2026-09-27 15:10:49.60093+00
premium	payment_confirmation	t	2026-09-27 15:10:49.60093+00
basico	shipping_zones	f	2026-10-05 00:31:41.000607+00
premium	shipping_zones	t	2026-10-05 00:31:41.000607+00
basico	live_tracking	f	2026-10-05 00:31:41.000607+00
premium	live_tracking	t	2026-10-05 00:31:41.000607+00
escala	instagram_feed	t	2026-10-11 00:10:33.946176+00
escala	meta_pixel	t	2026-10-11 00:10:33.946176+00
escala	payment_confirmation	t	2026-10-11 00:10:33.946176+00
escala	shipping_zones	t	2026-10-11 00:10:33.946176+00
escala	crm_clientes	t	2026-10-11 00:10:33.946176+00
escala	live_tracking	t	2026-10-11 00:10:33.946176+00
escala	carrito_whatsapp	t	2026-10-11 00:11:19.644449+00
escala	catalogo	t	2026-10-11 00:11:19.644449+00
escala	checkout_transferencia	t	2026-10-11 00:11:19.644449+00
escala	cotizador_dinamico	t	2026-10-11 00:11:19.644449+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type", "versioning_status", "lifecycle_configuration", "lifecycle_configuration_generation") FROM stdin;
productos	productos	\N	2026-08-15 02:14:18.474592+00	2026-08-15 02:14:18.474592+00	t	f	\N	\N	\N	STANDARD	DISABLED	\N	\N
\.


--
-- Data for Name: bucket_lifecycle_states; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."bucket_lifecycle_states" ("bucket_id", "generation", "next_run_at", "claim_id", "claim_until", "continuation", "last_started_at", "last_completed_at", "last_success_at", "last_result", "failure_count", "last_error", "updated_at") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: lifecycle_abandoned_artifacts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."lifecycle_abandoned_artifacts" ("bucket_id", "key", "name", "version", "attempted_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "archived_at", "is_delete_marker", "is_versioned") FROM stdin;
9f463278-7ce1-4d68-b24e-97778ec2e856	productos	1786943179620-m84icgvxi5i-D_NQ_NP_672640-MCO53436509579_012023-O.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:06:19.895555+00	2026-08-17 05:06:19.895555+00	2026-08-17 05:06:19.895555+00	{"eTag": "\\"765b358926ccfbfd17fe7ab35b145280\\"", "size": 18064, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:06:20.000Z", "contentLength": 18064, "httpStatusCode": 200}	b418e938-73e1-40b7-a3ca-cbab15673124	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
3fc06c82-1490-4f9c-a373-1246f3cf3614	productos	1786943229165-9cgyy5q4b8v-1.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:07:09.603377+00	2026-08-17 05:07:09.603377+00	2026-08-17 05:07:09.603377+00	{"eTag": "\\"651649f575b244ca2b6e7d6ca36985c9\\"", "size": 69062, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:07:10.000Z", "contentLength": 69062, "httpStatusCode": 200}	a8e40805-4f8e-4686-af17-686ed39b01d6	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
b903b968-b271-40c5-bbcd-1823e7af6d91	productos	1786943232810-fx7mjjujebg-1.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:07:13.253355+00	2026-08-17 05:07:13.253355+00	2026-08-17 05:07:13.253355+00	{"eTag": "\\"651649f575b244ca2b6e7d6ca36985c9\\"", "size": 69062, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:07:14.000Z", "contentLength": 69062, "httpStatusCode": 200}	90f51a6e-d51d-482f-9756-eeb242415b20	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
0e8ef6d9-313d-46c9-acd5-8529f8b16ca6	productos	1791152079488-c8be2170-3e17-4156-8b02-02b2669bafd7-Taza_dragonBall_posaVasos.jpg	9fab00b8-c2c3-42aa-9cce-215806a22146	2026-10-04 22:14:48.34493+00	2026-10-04 22:14:48.34493+00	2026-10-04 22:14:48.34493+00	{"eTag": "\\"d2314d1b029135d42cce079b3d5d6de5\\"", "size": 33063, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-10-04T22:14:49.000Z", "contentLength": 33063, "httpStatusCode": 200}	d1a5691f-06b6-417a-939b-2174d2bf598b	9fab00b8-c2c3-42aa-9cce-215806a22146	{}	\N	f	f
ca3d92a7-21df-474e-bbd5-017b28defd25	productos	1786943205552-7ti300y5glo-TA1390Y-fz1f.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:06:46.442558+00	2026-08-17 05:06:46.442558+00	2026-08-17 05:06:46.442558+00	{"eTag": "\\"81134f23df591086a497cf2926431f0d\\"", "size": 28706, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:06:47.000Z", "contentLength": 28706, "httpStatusCode": 200}	110f4321-0e11-478c-b0fc-6ef48705975d	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
446549a7-cdc6-4f54-b143-153cd4e57588	productos	1787440199056-qoc52q8zbfq-D_NQ_NP_672640-MCO53436509579_012023-O.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-22 23:10:08.957823+00	2026-08-22 23:10:08.957823+00	2026-08-22 23:10:08.957823+00	{"eTag": "\\"765b358926ccfbfd17fe7ab35b145280\\"", "size": 18064, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T23:10:09.000Z", "contentLength": 18064, "httpStatusCode": 200}	46910a0f-a20a-4c44-a4ee-9783c6d177fe	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
1badc8f4-b9f7-497f-ae88-946052711195	productos	1787969036867-u23ho1ieb2-1b0dcc50c90c48a096055ae2eb371d3a.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-29 02:04:05.363699+00	2026-08-29 02:04:05.363699+00	2026-08-29 02:04:05.363699+00	{"eTag": "\\"86a484a6f849336c2a7e102a350c7e20\\"", "size": 83832, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-29T02:04:06.000Z", "contentLength": 83832, "httpStatusCode": 200}	8a40e0f8-aa72-4af0-b411-dd42443c7607	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
481959c7-8e49-43eb-8233-8769683f2226	productos	1786760239440-mockup-hoodie.png	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-15 02:17:29.498734+00	2026-08-15 02:17:29.498734+00	2026-08-15 02:17:29.498734+00	{"eTag": "\\"9edb095f255bdde0c5a6a8a02d0efbf2\\"", "size": 907206, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-15T02:17:30.000Z", "contentLength": 907206, "httpStatusCode": 200}	e125305a-48d8-485f-8064-94d57820e5ef	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
28627eae-78a1-4e05-a983-671da1110727	productos	1786862180235-mockup-remera.png	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:36:22.119862+00	2026-08-16 06:36:22.119862+00	2026-08-16 06:36:22.119862+00	{"eTag": "\\"6cb09a5a408dc9efb9d83560a50ab3bd\\"", "size": 981757, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:36:23.000Z", "contentLength": 981757, "httpStatusCode": 200}	b5038e06-7822-4afe-bef4-448ed20b3e2d	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
d0656c82-4fb2-476f-93fd-a17e5e38fc34	productos	1786862808117-81d1de8843c34c69bf43ae9683d47c12.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:46:48.927655+00	2026-08-16 06:46:48.927655+00	2026-08-16 06:46:48.927655+00	{"eTag": "\\"4348ac548f583748a2a4a9fc75c65b24\\"", "size": 114830, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:46:49.000Z", "contentLength": 114830, "httpStatusCode": 200}	5ffda988-cae2-4af5-a98f-91b8cbbad472	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
6ac2ae7e-a828-4854-be0d-8e64ae383110	productos	1786862837602-1cd5c88a05a144409661d11f9cd9b172.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:47:17.851278+00	2026-08-16 06:47:17.851278+00	2026-08-16 06:47:17.851278+00	{"eTag": "\\"7445c1301dda72d6828948c5950e7e4c\\"", "size": 55306, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:47:18.000Z", "contentLength": 55306, "httpStatusCode": 200}	3cb536eb-4653-475d-8e5c-fd9b3b5b8a44	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
ecf065f6-1529-4cd5-b931-4e8028a5fdab	productos	1786862852623-1b0dcc50c90c48a096055ae2eb371d3a.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:47:33.632844+00	2026-08-16 06:47:33.632844+00	2026-08-16 06:47:33.632844+00	{"eTag": "\\"86a484a6f849336c2a7e102a350c7e20\\"", "size": 83832, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:47:34.000Z", "contentLength": 83832, "httpStatusCode": 200}	86cf5769-b2a4-4503-aab4-dcdad946453c	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
577b0d42-c931-42ac-a27d-7662bea8e319	productos	1786862948615-48f7a516820c467a813b83bb3d88fca8.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:49:10.634077+00	2026-08-16 06:49:10.634077+00	2026-08-16 06:49:10.634077+00	{"eTag": "\\"c952e11838885a431033922165168333\\"", "size": 115835, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:49:11.000Z", "contentLength": 115835, "httpStatusCode": 200}	ac008195-352c-4dfb-a905-303ce60107f9	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
820be636-0f49-4a2d-8673-2cdda0b53eea	productos	1786862956658-48f7a516820c467a813b83bb3d88fca8.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-16 06:49:17.178993+00	2026-08-16 06:49:17.178993+00	2026-08-16 06:49:17.178993+00	{"eTag": "\\"c952e11838885a431033922165168333\\"", "size": 115835, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-16T06:49:18.000Z", "contentLength": 115835, "httpStatusCode": 200}	8531584c-135f-465f-8863-7b5a588a1290	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
cd06b145-6baa-44bf-8553-d94ff1b78851	productos	1786934482271-kkhywibaupc-mockup-remera.png	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 02:41:24.480259+00	2026-08-17 02:41:24.480259+00	2026-08-17 02:41:24.480259+00	{"eTag": "\\"22a010be338d6b02700a5b08a40a54c0\\"", "size": 982469, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T02:41:25.000Z", "contentLength": 982469, "httpStatusCode": 200}	8727c548-2cd4-4145-b213-e69d56704dc8	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
ef79000d-6942-4c6c-8d1f-b7d191205327	productos	1786943094337-2g45k7olfyg-interfaz-camara-telefono-aplicacion-aplicacion-movil-toma-fotografias-videos-grafico-ilustracion_172533-626.avif	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:04:55.415599+00	2026-08-17 05:04:55.415599+00	2026-08-17 05:04:55.415599+00	{"eTag": "\\"92a25914b99dba4fc334e63743c4abb8\\"", "size": 63096, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:04:56.000Z", "contentLength": 63096, "httpStatusCode": 200}	79829dbb-14b6-4fc3-91ae-3507d63a8b61	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
b6e9c3d5-2cdd-487b-9457-8d4cf299f4ef	productos	1786943124893-s66w9niwrrg-smartphone-camera-interface-viewfinder-grid-260nw-2696870793.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:05:25.128933+00	2026-08-17 05:05:25.128933+00	2026-08-17 05:05:25.128933+00	{"eTag": "\\"fef04e0b4c8e02fdd269a62228959472\\"", "size": 9104, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:05:26.000Z", "contentLength": 9104, "httpStatusCode": 200}	e2be3f4b-c02b-4a94-bad7-47b1dfa0641d	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
b5ea4534-5a6b-4667-9ff0-bb0fdd2c6983	productos	1786943149359-gwsg1qhcrlo-interface-template-digital-cameras-including-260nw-2550244341.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:05:49.632579+00	2026-08-17 05:05:49.632579+00	2026-08-17 05:05:49.632579+00	{"eTag": "\\"580b6320e19d4c8fe3a62285f0f996b3\\"", "size": 10748, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:05:50.000Z", "contentLength": 10748, "httpStatusCode": 200}	14fc2437-62cf-4f54-885e-ca28f54d2463	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
b7fd0adb-dc8e-43a3-a74a-79fb28b0a5a0	productos	1788564484774-txirwq5jpu-bodys.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-09-04 23:28:24.218457+00	2026-09-04 23:28:24.218457+00	2026-09-04 23:28:24.218457+00	{"eTag": "\\"8bd79fc612338908da71cd6bf2fa5a82\\"", "size": 121285, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-04T23:28:25.000Z", "contentLength": 121285, "httpStatusCode": 200}	97922f67-36e7-4477-893d-56a17457caaf	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
ea040236-b901-4de0-8033-ffc292f855b9	productos	1786943173658-wd017r8zs7j-D_NQ_NP_672640-MCO53436509579_012023-O.webp	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-08-17 05:06:13.898868+00	2026-08-17 05:06:13.898868+00	2026-08-17 05:06:13.898868+00	{"eTag": "\\"765b358926ccfbfd17fe7ab35b145280\\"", "size": 18064, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-08-17T05:06:14.000Z", "contentLength": 18064, "httpStatusCode": 200}	848d2b38-4e92-430a-a456-96a12a1e99b2	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
90f345da-8acf-43c8-9349-7be8254b2751	productos	1788565111125-r9hrrd10mw9-taza_nombre_profe.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-09-04 23:38:49.272274+00	2026-09-04 23:38:49.272274+00	2026-09-04 23:38:49.272274+00	{"eTag": "\\"1125be560affe7e164c949c5c9a36ccb\\"", "size": 34470, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-04T23:38:50.000Z", "contentLength": 34470, "httpStatusCode": 200}	7819a282-f134-41b7-afe9-cb6240678c99	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
8032d076-0e7a-4348-940b-920282b65e80	productos	1788565408935-ifunyztrhkp-taza_nombre_profe.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-09-04 23:43:48.157449+00	2026-09-04 23:43:48.157449+00	2026-09-04 23:43:48.157449+00	{"eTag": "\\"1125be560affe7e164c949c5c9a36ccb\\"", "size": 34470, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-04T23:43:49.000Z", "contentLength": 34470, "httpStatusCode": 200}	4b3a402a-63cc-4396-8f03-f28a11f28450	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
00e5e42f-e45d-4ed4-b5ca-422bd3585ec9	productos	1788565446351-22nncfardev-taza_nombre_profe.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-09-04 23:44:25.013026+00	2026-09-04 23:44:25.013026+00	2026-09-04 23:44:25.013026+00	{"eTag": "\\"1125be560affe7e164c949c5c9a36ccb\\"", "size": 34470, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-04T23:44:25.000Z", "contentLength": 34470, "httpStatusCode": 200}	e6ca17c0-8f3b-499c-8cdc-651bde828892	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
1d02e5c8-fc8e-47a1-acdf-9c9bcca5a0b0	productos	1788565728893-d3ijenkc2jl-taza_nombre_profe.jpg	996bd19d-a0ee-4c2b-b83b-8194f6d84424	2026-09-04 23:49:07.86291+00	2026-09-04 23:49:07.86291+00	2026-09-04 23:49:07.86291+00	{"eTag": "\\"1125be560affe7e164c949c5c9a36ccb\\"", "size": 34470, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-09-04T23:49:08.000Z", "contentLength": 34470, "httpStatusCode": 200}	3a3842db-cd92-4aed-a2f1-524fba606050	996bd19d-a0ee-4c2b-b83b-8194f6d84424	{}	\N	f	f
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 159, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict rX3oS3yR84bDzR2keLJZ8Wa8uFWN6DcP2e4J65kmuKze3xwtkXhsdFP0Jt4awA4

RESET ALL;
