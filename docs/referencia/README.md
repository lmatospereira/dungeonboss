# Referências

## `MASTER_PROMPT_RPG_3D.md`

Prompt de qualidade fornecido pelo dono do projeto. Ele não é seguido ao pé da letra: as decisões abaixo foram tomadas com o dono do projeto (outubro de 2026).

| Ponto do prompt | Decisão neste projeto |
|---|---|
| Godot 4 + Blender, sem canvas 2D | **Adotado.** Nova versão em Godot 4.6 (GDScript, renderizador Compatibility) exportada para o navegador, com modelos e animações feitos no Blender. A versão em three.js fica no ar até a nova alcançá-la. |
| Combate de ação em tempo real | **Não adotado.** O combate continua **por turnos**, como no Dungeon Boss original citado como referência. |
| Sem rede, login ou API | **Não adotado.** O jogo tem contas e Invasão (PvP assíncrono) com servidor próprio. Sem servidor, continua jogável offline. |
| 3 heróis novos (Brann, Íria, Nilo) | **Não adotado.** Mantidos os 8 heróis do jogo, que já cobrem os mesmos arquétipos. |
| Dados separados do código, dano centralizado | **Adotado.** `data/*.json` é a fonte única dos números (etapa 1). |
| Testes, smoke test, auditoria de placeholders, licenças de assets | **Adotado.** |
| Pausa real, volume de música/efeitos, desligar tremida, hit-stop | **Adotado** na versão Godot. |
| IA determinística e ajustável por dados | **Adotado.** O simulador de balanceamento usa sementes fixas. |

## Dungeon Boss (Big Fish Games): o que foi levantado

- Combate por turnos, com a ordem definida pela velocidade (rápido, normal e lento), equipe de até 4 heróis e masmorras em etapas com chefe no fim.
- Ataques especiais com recarga.
- 5 elementos: Vermelho > Verde > Azul > Vermelho, e Amarelo ⇄ Roxo.
- Classes (Armored, Caster, Flying, Healer, Magical, Rogue, Tank, Warrior) e heróis de 3 a 5 estrelas.
- Evolução (ascensão, 2 vezes) com "Evo Eggs" da cor do elemento, que caem em masmorras daquela cor.
- Ouro, gemas e pergaminhos, e itens brilhantes no cenário que dão ouro.
- PvP defendendo a própria masmorra.

Fontes: [Vulcan Post](https://vulcanpost.com/391701/how-to-play-mobile-app-game-dungeon-boss/), [Dungeon Boss Wiki: Evos](https://dungeonboss.fandom.com/wiki/Evos?oldid=7474) e [TouchArcade](https://devforums.toucharcade.com/threads/dungeon-boss-epic-3d-battle-game-by-big-fish-games-inc.249640/page-4). Vídeo de referência de ritmo e leitura visual: [Dungeon Boss: Gameplay Walkthrough Part 1](https://www.youtube.com/watch?v=-JKRADU3FiI).

Nada de personagens, nomes, interface, mapas, áudio ou arte do jogo original é reproduzido.
