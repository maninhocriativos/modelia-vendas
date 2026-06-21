# Modelia Vendas

Landing page integrada ao Modelia CRM e ao checkout Pix do Asaas.

## Executar

```bash
npx wrangler pages dev .
```

O fluxo cria o lead no CRM, registra CPF/CNPJ e solicita a cobrança ao Asaas. A chave do Asaas permanece apenas no backend do CRM.

