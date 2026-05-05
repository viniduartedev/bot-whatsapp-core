# Setup Firebase bot-whatsapp-ai

## Papel das bases

`bot-whatsapp-ai` é a base do domínio conversacional e de integração do bot/core.
O Firebase project ID real criado no console é `bot-whatsapp-ai-d10ef`.

`agendamento-ai` continua sendo a base operacional do admin de agenda nesta fase.
Os serviços reais exibidos no WhatsApp também vêm do `agendamento-ai-9fbfb`.
O fluxo alvo fica:

```text
BOT -> CORE -> AGENDAMENTO-AI
```

Contrato oficial desta fase:

- `servicesSource = agendamento-ai-9fbfb`
- `conversationSource = bot-whatsapp-ai-d10ef`
- `appointmentsTarget = agendamento-ai-9fbfb`

Compatibilidade: `appointmentRequests` continua disponível como coleção auxiliar, mas o handoff operacional primário do Core volta a apontar para `appointments` para preservar o contrato real do sistema de agenda.

Não há migração completa nesta etapa. A preparação serve para permitir que o bot/core leia configuração conversacional própria e eventos técnicos sem transformar o `bot-whatsapp-ai-d10ef` na fonte de verdade dos serviços. O catálogo real de serviços permanece no admin operacional de agenda.

## Serviços Firebase

Serviço mínimo nesta fase:

- Cloud Firestore: banco principal do bot/core.

Serviços não obrigatórios agora:

- Firebase Authentication: não é necessário para a escrita técnica quando o bot/core usa backend, Admin SDK, IAM ou seed via CLI. Será necessário antes de liberar leitura administrativa direta pelo client SDK contra esta nova base.
- Analytics: existe `measurementId` na config web, mas não é requisito do core.
- Storage: não é necessário no escopo inicial.

## Coleções

Versão mínima para iniciar:

- `tenants`: cadastro do tenant lógico, começando por `clinica-devtec`.
- `projects`: raiz operacional do Core por tenant, começando por `core-project-clinica-devtec`.
- `botProfiles`: identidade, mensagens e menu principal do bot por projeto.
- `projectConnections`: ponte configurável do core para `agendamento-ai`.
- `integrationLogs`: trilha técnica mínima de bootstrap e integrações.

Coleções runtime previstas:

- `sessions`: estado de conversa por contato/canal.
- `serviceRequests`: solicitações normalizadas criadas pelo bot/core.
- `inboundEvents`: webhooks e mensagens recebidas.
- `outboundEvents`: mensagens e despachos emitidos.
- `integrationEvents`: eventos de integração outbound para o domínio de agendamento.
- `contacts`: identidade por canal quando o core precisar materializar contatos.

Coleções operacionais em `agendamento-ai-9fbfb` usadas pelo Core nesta fase:

- `services`: catálogo real cadastrado e operado pelo sistema de agenda, consultado pelo bot para montar menu e validar solicitações.
- `appointmentRequests`: coleção auxiliar mantida durante a transição, sem papel primário no fluxo operacional.
- `appointments`: coleção operacional compatível com o admin, materializada pelo Core para restaurar o contrato real já validado.

## Regras Firestore

As regras dedicadas estão em `firestore.bot-whatsapp-ai.rules` e são referenciadas por `firebase.bot-whatsapp-ai.json`.

Estado atual para homologação:

- leitura liberada temporariamente para o painel/core conseguir homologar sem Firebase Auth;
- escrita runtime por identidade técnica com claim `botCore == true` ou `serviceRole == "bot-core"`;
- escrita sem Auth limitada ao escopo piloto `clinica-devtec` / `core-project-clinica-devtec`;
- delete bloqueado nas coleções iniciais.

Limitação consciente: este modo de rules é de desenvolvimento. A próxima etapa é remover a permissão piloto sem Auth e exigir Authentication + custom claims por tenant antes de produção.

Deploy das regras:

```bash
npm run deploy:bot-whatsapp-ai:rules
```

Comando equivalente:

```bash
firebase deploy --only firestore:rules --project bot-whatsapp-ai-d10ef --config firebase.bot-whatsapp-ai.json
```

## Envs

Use `VITE_BOT_FIREBASE_*` para a config web do domínio bot/core e `VITE_AGENDA_FIREBASE_*` para o domínio operacional da agenda.

O código mantém `VITE_FIREBASE_*` apenas como fallback legado para a agenda. O core não usa mais `VITE_FIREBASE_*` como fallback do bot.

Arquivos de referência:

```bash
.env.bot-whatsapp-ai.example
.env.agendamento-ai.example
```

Variáveis recomendadas:

- `VITE_BOT_FIREBASE_API_KEY`
- `VITE_BOT_FIREBASE_AUTH_DOMAIN`
- `VITE_BOT_FIREBASE_PROJECT_ID`
- `VITE_BOT_FIREBASE_STORAGE_BUCKET`
- `VITE_BOT_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_BOT_FIREBASE_APP_ID`
- `VITE_BOT_FIREBASE_MEASUREMENT_ID`
- `VITE_AGENDA_FIREBASE_API_KEY`
- `VITE_AGENDA_FIREBASE_AUTH_DOMAIN`
- `VITE_AGENDA_FIREBASE_PROJECT_ID`
- `VITE_AGENDA_FIREBASE_STORAGE_BUCKET`
- `VITE_AGENDA_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_AGENDA_FIREBASE_APP_ID`
- `VITE_AGENDA_FIREBASE_MEASUREMENT_ID`
- `CORE_INTERNAL_TOKEN`
- `BOT_FIREBASE_PROJECT_ID`
- `BOT_FIREBASE_SERVICE_ACCOUNT_PATH`
- `BOT_FIREBASE_SERVICE_ACCOUNT_KEY`
- `BOT_CORE_TENANT_SLUG`
- `AGENDA_FIREBASE_PROJECT_ID`
- `AGENDA_FIREBASE_SERVICE_ACCOUNT_KEY`
- `AGENDAMENTO_FIREBASE_PROJECT_ID`
- `AGENDAMENTO_CORE_API_BASE_URL`
- `AGENDAMENTO_CORE_API_TOKEN`

Clientes no código:

- `botDb`: Firestore do projeto `bot-whatsapp-ai-d10ef`, usado por `sessions`, `serviceRequests` e demais dados conversacionais do bot/core.
- `agendaDb`: Firestore do projeto `agendamento-ai-9fbfb`, usado por `services`, `appointments` operacionais e `appointmentRequests` apenas como coleção auxiliar.
- `db`: alias temporário para `botDb` durante a transição.

## Seed inicial

O seed idempotente do tenant piloto está em `scripts/seed-bot-whatsapp-ai.ts`.
Ele grava somente dados conversacionais no project ID `bot-whatsapp-ai-d10ef` e bloqueia execução se `BOT_FIREBASE_PROJECT_ID` apontar para outro projeto.

Conteúdo criado:

- `tenants/clinica-devtec`
- `projects/core-project-clinica-devtec`
- `botProfiles/core-project-clinica-devtec`
- uma conexão outbound ativa provider `firebase` para `agendamento-ai`, com `targetTenantId = "demo-tenant"`
- um contato/sessão/serviceRequest de homologação do comando `/dev clinica-devtec`
- um log de bootstrap em `integrationLogs`

Executar:

```bash
npm run seed:bot-whatsapp-ai
```

Serviços reais esperados para consulta do bot em `agendamento-ai-9fbfb`:

- `consulta_avaliacao`
- `retorno`
- `procedimento`

Consulta esperada para o bot/core:

```text
agendamento-ai-9fbfb / services where tenantSlug == "clinica-devtec" and active == true
```

O `projectId` do Core pode aparecer nos logs como contexto conversacional, mas não deve transformar `bot-whatsapp-ai-d10ef` em fonte do catálogo de serviços.

## Integração core -> agenda

A integração explícita fica em `src/core/integrations/agendamentoAi.ts`.

Quando uma `projectConnection` ativa usa `provider = "firebase"`, `targetProjectId = "agendamento-ai-9fbfb"` e `targetTenantId = "demo-tenant"`, o core espelha um documento determinístico em:

```text
agendamento-ai-9fbfb / appointments / appointment-from-{serviceRequestId}
```

O payload espelhado preserva:

- `projectId`
- `tenantId` operacional da agenda, vindo de `projectConnections.targetTenantId`
- `tenantSlug`
- `requestId`
- `serviceId`
- `serviceNameSnapshot`
- `service.key`
- `service.label`
- `contactId`
- `customerName`
- `customerPhone`
- `date` em ISO `YYYY-MM-DD`
- `time` em `HH:mm`
- `status = "pending"`
- `integrationEventId`
- `mirroredFrom.firebaseProjectId = "bot-whatsapp-ai-d10ef"`
- `firebaseProjectId = "bot-whatsapp-ai-d10ef"`

Regra de negócio: o bot/Core volta a materializar `appointments` com `status = "pending"` para respeitar o contrato operacional já utilizado pelo admin, sem recolapsar os domínios em um banco único.

O caminho HTTP antigo continua compatível para `projectConnections` com provider `http`.

### Confirmação automática via API interna

O botão **Confirmar** da tela `Service Requests` chama `confirmServiceRequest(request.id)` em `src/core/use-cases/confirmServiceRequest.ts`. A API interna expõe o mesmo fluxo operacional para o bot acionar a confirmação sem intervenção manual:

```text
POST /api/service-requests/confirm
```

Payload:

```json
{
  "serviceRequestId": "ID_DA_REQUEST"
}
```

Autenticação:

```text
Authorization: Bearer <CORE_INTERNAL_TOKEN>
```

Exemplo de teste:

```bash
curl -X POST "$CORE_API_URL/api/service-requests/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CORE_INTERNAL_TOKEN" \
  -d '{"serviceRequestId":"ID_DA_REQUEST"}'
```

Resposta integrada:

```json
{
  "ok": true,
  "serviceRequestId": "ID_DA_REQUEST",
  "status": "integrado",
  "externalAppointmentId": "appointment-from-ID_DA_REQUEST"
}
```

Se a solicitação já estiver com `status = "integrado"`, a API não cria outro appointment e retorna:

```json
{
  "ok": true,
  "alreadyIntegrated": true,
  "serviceRequestId": "ID_DA_REQUEST",
  "externalAppointmentId": "appointment-from-ID_DA_REQUEST"
}
```

Envs server-side esperadas no Core/Vercel:

```env
CORE_INTERNAL_TOKEN=...
BOT_FIREBASE_PROJECT_ID=bot-whatsapp-ai-d10ef
BOT_FIREBASE_SERVICE_ACCOUNT_KEY=...
AGENDA_FIREBASE_PROJECT_ID=agendamento-ai-9fbfb
AGENDA_FIREBASE_SERVICE_ACCOUNT_KEY=...
```

`BOT_FIREBASE_SERVICE_ACCOUNT_KEY` e `AGENDA_FIREBASE_SERVICE_ACCOUNT_KEY` aceitam o JSON da service account ou o JSON codificado em base64. Para execução local, também é possível usar `BOT_FIREBASE_SERVICE_ACCOUNT_PATH` e `AGENDA_FIREBASE_SERVICE_ACCOUNT_PATH`.

O fluxo automático mantém o destino validado:

```text
bot-whatsapp-ai-d10ef / serviceRequests / {serviceRequestId}
agendamento-ai-9fbfb / appointments / appointment-from-{serviceRequestId}
```

Não há escrita em `agendamento-ai-9fbfb/appointmentRequests` neste endpoint.

## Logs de homologação

Logs esperados no console:

- `[firebase][bot-core] projectId=bot-whatsapp-ai-d10ef`
- `[firebase][agenda] projectId=agendamento-ai-9fbfb`
- `[core][architecture] servicesSource=agendamento-ai-9fbfb conversationSource=bot-whatsapp-ai-d10ef appointmentsTarget=agendamento-ai-9fbfb`
- `[core][services] servicesSource=agendamento-ai-9fbfb conversationSource=bot-whatsapp-ai-d10ef tenant=clinica-devtec ... servicesLoaded=3`
- `[bot][session] conversationSource=bot-whatsapp-ai-d10ef tenant=clinica-devtec ...`
- `[core][serviceRequest:create] conversationSource=bot-whatsapp-ai-d10ef ... service=consulta_avaliacao ...`
- `[core][confirm] conversationSource=bot-whatsapp-ai-d10ef servicesSource=agendamento-ai-9fbfb appointmentsTarget=agendamento-ai-9fbfb ... targetProject=agendamento-ai-9fbfb`
- `[core][mirror] appointmentStart serviceRequestId=... sessionId=... tenantSlug=... targetTenantId=...`
- `[core][mirror] appointmentPayloadBuilt serviceRequestId=... appointmentId=... tenantId=demo-tenant ... status=pending`
- `[core][mirror] appointmentWriteSuccess serviceRequestId=... appointmentId=...`
- `[core][agenda-sync] appointmentMirrored appointmentsTarget=agendamento-ai-9fbfb conversationSource=bot-whatsapp-ai-d10ef tenant=clinica-devtec service=consulta_avaliacao`
- `[agenda][appointments] appointmentsTarget=agendamento-ai-9fbfb tenant=clinica-devtec ...`

## Checklist piloto

1. Rodar `npm run deploy:bot-whatsapp-ai:rules`.
2. Rodar `npm run seed:bot-whatsapp-ai`.
3. Abrir o painel com o projeto ativo `core-project-clinica-devtec`.
4. Confirmar em `agendamento-ai-9fbfb/services` que os serviços reais carregáveis do bot são `consulta_avaliacao`, `retorno`, `procedimento`.
5. Confirmar a `serviceRequest` piloto `clinica-devtec-service-request-whatsapp-dev`.
6. Verificar em `agendamento-ai-9fbfb/appointments` o documento `appointment-from-clinica-devtec-service-request-whatsapp-dev`.
7. Abrir a página de appointments e validar o filtro por `tenantSlug = "clinica-devtec"` e a exibição de `service.label`.
8. Confirmar que nenhum documento novo é criado diretamente em `agendamento-ai-9fbfb/appointmentRequests` durante essa etapa do bot/Core.
9. Chamar `POST /api/service-requests/confirm` com uma `serviceRequest` real em `status = "novo"` e validar que a resposta retorna `ok = true`.
10. Repetir a chamada para o mesmo ID e validar `alreadyIntegrated = true`, sem duplicar o documento em `agendamento-ai-9fbfb/appointments`.

Observação: o runtime WhatsApp que processa literalmente `/dev clinica-devtec` não está neste repo. Este repo agora fornece os helpers e o contrato de dados para esse bot ler `services` no `agendaDb`, persistir `sessions`/`serviceRequests` no `botDb` e acionar o mirror de `appointments` para `agendaDb`.
