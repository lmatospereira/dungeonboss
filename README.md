# Masmorra do Rei Ogro

RPG de masmorra em 3D com combate por turnos, que roda no navegador. Tem 8 heróis com evolução, 4º poder e arma lendária, 4 masmorras com chefes, contas de jogador e Invasão (PvP assíncrono com ranking). O servidor próprio é uma API Node com Postgres, em Docker.

Documentação em português: [LEIAME.md](LEIAME.md) e a pasta [docs/](docs/).

```bash
npm install
npm run build          # gera www/ (site e app) e dist/artifact.html
npx http-server www    # http://localhost:8080 (offline, sem a API)
```
