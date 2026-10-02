# Botoeira de Sons 5×10

Botoeira web com 50 botões de áudio.

## Recursos

- 5 linhas × 10 botões
- Upload de áudio individual
- Nome personalizado para cada botão
- Reprodução e parada
- Edição e remoção do áudio
- Persistência dos arquivos via IndexedDB
- Layout responsivo
- Sem backend e sem banco externo
- Pronto para GitHub + Vercel

## Importante sobre o armazenamento

Os áudios ficam salvos no **IndexedDB do navegador**. Portanto:

- permanecem disponíveis ao fechar e abrir o site no mesmo navegador;
- não são enviados para a Vercel;
- não são sincronizados automaticamente entre celulares/computadores;
- limpar os dados do site/navegador pode apagar os áudios configurados.

## Rodar localmente

Como é um projeto estático, você pode abrir `index.html` diretamente. Para uma experiência mais próxima da hospedagem, use qualquer servidor HTTP local.

## Publicar na Vercel

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto para o repositório.
3. Na Vercel, escolha **Add New → Project**.
4. Importe o repositório do GitHub.
5. Framework Preset: **Other**.
6. Não é necessário Build Command.
7. Publique com **Deploy**.

O arquivo `vercel.json` já define o comportamento necessário para o projeto estático.
