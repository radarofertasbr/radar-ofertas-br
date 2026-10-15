/* =====================================================================
   RADAR DE OFERTAS BR — CONFIGURAÇÃO DA LANDING PAGE
   Este é o ÚNICO arquivo que precisa ser editado no dia a dia.
   ===================================================================== */
window.RADAR_CONFIG = {
  /* Link oficial do grupo (NÃO alterar; todos os botões usam este link exato) */
  WHATSAPP_URL: "https://chat.whatsapp.com/DLr1y8CotNZGa27X7BKjH1?s=cl&p=i&mlu=4&ilr=4&iam=2",

  /* Meta Pixel: cole aqui só os números do ID do pixel, ex.: "123456789012345".
     Vazio = pixel desligado e aviso de cookies escondido. */
  PIXEL_ID: "",

  /* Vitrine do Afiliado Shopee (link oficial da Pamela, EXATAMENTE como a Shopee gerou; nunca alterar/embrulhar).
     Vazio = botão "Explorar a vitrine" aparece desativado. A vitrine da Shopee se atualiza sozinha. */
  VITRINE_URL: "https://collshp.com/ajfpmvitrinemixbrasil?share_channel_code=1&view=storefront",

  /* Quantos produtos do catálogo aparecem antes do botão "Ver mais achados" */
  VITRINE_PAGE_SIZE: 8,

  /* Contador de cliques gratuito, sem cookies e sem dados pessoais (abacus.jasoncameron.dev).
     Para desligar, deixe COUNTER_NAMESPACE: "". */
  COUNTER_BASE: "https://abacus.jasoncameron.dev",
  COUNTER_NAMESPACE: "radar-ofertas-br-lp",

  /* Teste A/B: "auto" = sorteio fixo por visitante (50/50). Use "a" ou "b" para travar uma versão.
     A URL ?v=a ou ?v=b sempre tem prioridade. */
  AB_MODE: "auto"
};
