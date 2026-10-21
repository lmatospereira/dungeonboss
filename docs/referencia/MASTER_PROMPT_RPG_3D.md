# MASTER PROMPT --- Projeto completo de RPG de combate tático 3D inspirado em Dungeon Boss

> **Objetivo:** entregar um jogo jogável, visualmente autoral e completo
> como projeto de desenvolvimento, a partir de uma única solicitação a
> um agente de programação com acesso ao repositório, terminal e
> ferramentas de criação de assets.
>
> **Referência de gameplay:** [Dungeon Boss --- Gameplay Walkthrough
> Part 1 (iOS/Android)](https://www.youtube.com/watch?v=-JKRADU3FiI).
> Use a referência para entender a linguagem visual e o ritmo do
> combate, não para copiar personagens, nomes, mapas, interface, áudio
> ou assets protegidos.

## 1. Missão e definição de pronto

Crie um RPG de fantasia com combate em arenas, personagens 3D
estilizados, inimigos expressivos, cenário de masmorra construído com
módulos artísticos e interface de jogo polida. A referência visual
enviada mostra: câmera elevada em perspectiva oblíqua, arena de pedra,
pilares e estandartes, herói e inimigo com silhuetas legíveis, sombras,
cores fortes e botões de habilidades na parte inferior.

O resultado **não pode parecer um template genérico, protótipo de cubes
ou demo feita às pressas**. Deve ter direção de arte coerente, assets
próprios, animações, efeitos de combate, áudio, feedback visual,
progressão e uma primeira missão completa.

### Critérios obrigatórios de conclusão

-   O projeto abre e executa no motor escolhido, sem depender de
    serviços pagos ou credenciais externas.
-   Existe um fluxo completo: tela inicial → seleção/preparação do herói
    → missão → combate → vitória/derrota → recompensas → voltar ao menu.
-   O primeiro nível tem começo, meio e fim, pelo menos três encontros e
    um chefe ou encontro final especial.
-   Há pelo menos 3 heróis jogáveis selecionáveis, 5 tipos de inimigos,
    1 chefe, 1 arena completa e 2 variações de cenário obtidas por
    composição de módulos e iluminação.
-   Cada personagem possui modelo 3D, materiais, rig, animações e
    efeitos próprios. Não substituir personagens por ícones ou formas
    geométricas.
-   As habilidades são funcionais e têm efeitos visuais/sonoros
    específicos.
-   UI, áudio, salvamento, pausa, configurações básicas e feedback de
    estado estão implementados.
-   Incluir documentação, instruções de execução, controles, estrutura
    dos assets e testes.
-   Não declarar algo concluído se for apenas um placeholder. Registrar
    limitações reais no README.

## 2. Restrições técnicas inegociáveis

1.  **Não usar HTML Canvas, Canvas 2D, Canvas API, Phaser, nem
    renderização do jogo em um elemento canvas.**
2.  Não construir o jogo como uma página web com sprites posicionados
    por CSS.
3.  Usar um motor de jogo de verdade: **Godot 4.x com renderização 3D
    nativa** é a escolha padrão. Usar cenas `.tscn`, nós 3D,
    `CharacterBody3D`/`Node3D`, `AnimationPlayer` ou `AnimationTree`,
    `Camera3D`, luzes, materiais, colisões, partículas 3D e recursos
    próprios do motor.
4.  Não simular o 3D com imagens planas. Sprites 2D só podem ser usados
    em partículas secundárias ou elementos de HUD; heróis, inimigos e
    cenário principal devem ser malhas 3D.
5.  Evitar geração procedural como solução artística. O mundo deve ser
    **feito principalmente com assets modelados e posicionados de forma
    intencional**. Procedural permitido apenas para tarefas auxiliares,
    como distribuição controlada de pequenas pedras, variação de
    partículas ou montagem de módulos já desenhados.
6.  Não usar assets de terceiros sem licença compatível. Priorizar
    assets autorais. Não baixar/copiar arquivos extraídos do jogo de
    referência.
7.  Não entregar apenas um documento de design, wireframe, mockup ou
    cena vazia: entregar o projeto executável.
8.  Não parar para perguntar preferências. Tome decisões sensatas,
    documente-as e implemente o escopo vertical completo.
9.  Não esconder falhas com telas falsas, botões sem ação, animações que
    não afetam o jogo ou logs que fingem sucesso.

## 3. Direção de arte

### Identidade

Fantasia sombria com humor visual e personagens carismáticos: proporções
estilizadas, cabeças e mãos expressivas, armas com leitura clara,
materiais com acabamento artesanal e cores de destaque. O cenário deve
parecer um lugar construído por uma civilização fictícia, não um chão
genérico com paredes aleatórias.

### Linguagem visual

-   Câmera 3D elevada, perspectiva oblíqua de arena, enquadramento
    próximo o suficiente para ler expressões, armas e impactos.
-   Modelos low-poly/high-quality stylized: silhuetas fortes, volumes
    bem definidos, bevels discretos, materiais PBR estilizados e paleta
    consistente.
-   Pedra antiga com blocos individuais, bordas gastas, rachaduras
    controladas, musgo localizado, juntas e variação cromática sutil.
-   Pilares, bases esculpidas, arcos, correntes, estandartes, tochas e
    objetos narrativos desenhados para o cenário.
-   Heróis e inimigos com proporções, paletas e silhuetas distintas.
    Evitar variações que sejam apenas troca de cor.
-   Iluminação artística com luz principal quente, preenchimento frio,
    sombras legíveis, ambient occlusion quando suportado e contraste
    suficiente para separar personagens do fundo.
-   Interface integrada à identidade visual: placas metálicas, couro,
    madeira, dourado envelhecido e ícones desenhados para o jogo.
-   Efeitos de habilidade com cor, forma, duração e intensidade
    associados à personalidade do personagem.
-   Evitar bloom excessivo, excesso de partículas, texturas repetidas
    evidentes, assets sem escala coerente e saturação indiscriminada.

### Originalidade

Criar nomes, história, personagens, formas, ícones, cenários, sons e
composição próprios. A referência define apenas o gênero e a leitura
geral de gameplay. Não reproduzir personagens, logotipo, UI exata,
mapas, animações ou áudio do jogo citado.

## 4. Produção obrigatória de assets

Criar uma pasta de assets organizada por função. Usar Blender para
modelos/rigs/animações quando disponível, e ferramentas de imagem/áudio
locais ou scripts de conversão quando apropriado.

Estrutura sugerida:

``` text
res://
  project.godot
  scenes/
    boot/
    menus/
    combat/
    arenas/
    characters/
    enemies/
    ui/
  scripts/
    core/
    combat/
    characters/
    enemies/
    progression/
    save/
    ui/
  assets/
    characters/
      heroes/
      enemies/
      boss/
    environment/
      architecture/
      props/
      materials/
      decals/
    vfx/
    audio/
      music/
      sfx/
    ui/
      icons/
      panels/
      fonts/
  data/
    heroes/
    enemies/
    abilities/
    missions/
  tests/
  docs/
  README.md
```

### Lista mínima de assets

**Personagens** - 3 heróis autorais com mesh 3D, materiais, rig
esquelético, animações de idle, locomotion curta, ataque, habilidade,
dano, vitória e derrota. - 5 inimigos com silhuetas distintas, animações
de idle, ataque, dano e morte. - 1 chefe com modelo maior, pelo menos 2
padrões de ataque e animação de entrada/derrota. - Armas e acessórios
modelados como meshes separados quando isso facilitar animação e
variação.

**Ambiente** - Kit modular de masmorra: peças de piso, bordas, cantos,
degraus, paredes, pilares, bases, arcos, portas e colunas quebradas. -
Props: estandartes, braseiros, correntes, urnas, baús, ossos, placas,
cristais e pedras quebradas. - Pelo menos 1 arena montada manualmente
com composição, pontos focais e limites de navegação claros. - Materiais
e decals autorais para pedra, metal, tecido, couro e madeira.

**VFX** - Impacto de arma, faísca, poeira, golpe crítico, dano recebido,
cura, escudo, projétil, explosão mágica, morte e recompensa. - Usar
`GPUParticles3D`/`CPUParticles3D`, meshes, shaders e luzes temporárias
conforme apropriado. Cada efeito deve ter escala, duração e cor
controladas. - Criar efeitos legíveis sem cobrir personagens ou
interface.

**Áudio** - Música ambiente de masmorra em loop. - Sons distintos para
seleção, clique, ataque leve, ataque pesado, habilidade por herói, dano,
crítico, morte, vitória, derrota e recompensa. - Áudio original ou de
fonte com licença clara; registrar atribuição e licença em
`docs/ASSET_LICENSES.md`. - Implementar volume separado de música e
efeitos.

**Interface** - Logo e identidade próprios. - Botões, painéis, retratos
dos heróis, barras de vida, ícones de habilidades, indicadores de
recarga, mensagens de dano e tela de resultado. - Não usar emojis como
arte final da interface. - Se uma ferramenta de arte não estiver
disponível, criar assets autorais com Blender, SVG/PNG gerados por
ferramenta local ou materiais/shaders do motor --- nunca substituir tudo
por retângulos coloridos.

### Regra de honestidade dos assets

Antes de finalizar, faça inventário de todos os arquivos usados. Se
algum asset for temporário, marque-o explicitamente e substitua-o quando
possível. O objetivo é minimizar placeholders, não disfarçá-los.

## 5. Conceito do jogo

Título de trabalho: **Relíquias da Cripta**. O título pode ser refinado,
mantendo a identidade original.

O jogador comanda uma pequena equipe de heróis que atravessa uma cripta
antiga, enfrentando guardiões e criaturas. O primeiro capítulo deve
apresentar o universo por meio de cenário, objetos, animações, falas
curtas e encontros de combate, sem depender de longas cutscenes.

### Heróis iniciais

Implemente três arquétipos completos, com atributos e habilidades
próprias:

1.  **Brann, o Quebra-Ferro** --- guerreiro corpo a corpo, resistência
    alta, ataque frontal e golpe pesado em área.
2.  **Íria, a Cinza Viva** --- maga de fogo, defesa baixa, projétil
    mágico e explosão em área.
3.  **Nilo, o Vigia das Runas** --- suporte, cura/escudo e ataque rúnico
    de alcance médio.

Os nomes são originais para este projeto e podem ser ajustados se houver
conflito de marca conhecido. Não usar personagens licenciados.

### Inimigos

-   Esqueleto de guarda: inimigo básico corpo a corpo.
-   Saqueador goblinoide: rápido, baixa resistência.
-   Arqueiro da cripta: ataque à distância e reposicionamento.
-   Acólito espectral: suporte ou magia de área.
-   Cavaleiro oco: inimigo pesado com telegráficos claros.
-   Chefe: **O Carcereiro de Basalto**, com fase inicial, ataque
    carregado telegrafado e fase final com maior pressão.

Cada inimigo deve ter parâmetros em dados separados do código: vida,
dano, defesa, velocidade, alcance, comportamento, recompensas e
resistências.

## 6. Combate e controles

### Loop de jogo

1.  A equipe entra na arena.
2.  O jogador seleciona um herói ativo ou alterna entre heróis.
3.  O jogador move/posiciona o herói, ataca e usa habilidades.
4.  Inimigos telegráfam seus ataques antes de causar dano.
5.  O jogador vence o encontro, recebe recompensa e avança.
6.  Ao concluir a missão, recebe tela de resultado, XP/moeda e progresso
    salvo.

### Controles de desktop

-   WASD ou setas: movimentação do herói ativo.
-   Mouse: selecionar alvo/elemento de interface.
-   Botão esquerdo: ataque básico ou ação contextual.
-   Q/E/R: habilidades do herói ativo.
-   Tab: alternar herói.
-   Esc: pausar.
-   Suporte a gamepad quando viável, sem quebrar o teclado/mouse.

Se a proposta final usar combate por turnos em vez de ação em tempo
real, a escolha precisa ser consistente do começo ao fim. Para este
projeto, implementar **combate de ação em arena com pausas curtas para
leitura tática**, sem misturar turnos incompletos com ação em tempo
real.

### Regras de combate

-   Movimento limitado à arena com colisão e navegação confiável.
-   Alvos selecionáveis e alvo atual claramente indicado.
-   Ataques respeitam alcance, cooldown e estado do personagem.
-   Dano calculado em um único sistema central, com modificadores
    explícitos.
-   Vida, morte, invulnerabilidade curta após dano quando apropriado e
    estados de controle.
-   Habilidades com custo/cooldown, telegráfico visual e feedback
    sonoro.
-   Inimigos com máquina de estados clara: idle, approach, telegraph,
    attack, recover, hit, dead.
-   IA simples, determinística e ajustável por dados. Não usar
    comportamento aleatório para esconder ausência de design.
-   Dificuldade crescente por encontro e chefe com padrões que o jogador
    possa aprender.
-   Vitória e derrota devem ser estados reais, não apenas uma mensagem
    visual.

## 7. Câmera e composição da arena

-   `Camera3D` em perspectiva, elevada e oblíqua, acompanhando o combate
    com suavidade.
-   Enquadrar personagens e inimigos importantes sem cortes bruscos ou
    atravessar paredes.
-   Limites da câmera definidos pela arena.
-   Personagens com orientação coerente para o alvo e animações de
    ataque alinhadas ao alvo.
-   Profundidade e sombras devem tornar claras as distâncias.
-   Evitar câmera ortográfica plana, vista lateral 2D ou perspectiva
    isométrica falsa.
-   HUD sempre legível em diferentes resoluções, com escala adaptativa
    sem renderizar a cena inteira em Canvas.

## 8. Interface, menus e experiência do usuário

Implementar: - Tela de abertura com logo e fundo 3D animado. - Menu
principal com Jogar, Heróis, Configurações e Sair. - Seleção de herói
com modelo 3D giratório, atributos, descrição e habilidades. - Tela de
missão com objetivo, composição inimiga e recompensa. - HUD de combate:
vida, herói ativo, retratos/alternância, habilidades, cooldowns, alvo,
objetivos e pausa. - Indicadores de dano e cura com tamanho e duração
controlados. - Tela de vitória com recompensas e opção de
continuar/voltar. - Tela de derrota com tentar novamente/voltar. -
Configurações de áudio e qualidade gráfica. - Pausa real: suspender a
simulação de combate e permitir retomar ou sair. - Feedback de hover,
foco, clique, indisponibilidade e cooldown. - Navegação básica por
teclado e foco acessível.

Não deixar botões decorativos. Todo controle visível deve funcionar ou
ser removido.

## 9. Arquitetura e qualidade do código

-   Separar lógica de combate, dados de personagens, IA, interface,
    progressão, áudio, efeitos e salvamento.
-   Usar recursos/dados (`.tres`, `.res`, JSON ou Resources próprios do
    Godot) para atributos e habilidades, sem valores duplicados em
    vários scripts.
-   Evitar scripts monolíticos. Cada classe deve ter responsabilidade
    clara.
-   Centralizar aplicação de dano, morte, recompensa, cooldown e eventos
    de combate.
-   Usar sinais/eventos do Godot para comunicação entre sistemas quando
    fizer sentido.
-   Evitar dependências circulares, `get_node()` frágeis espalhados e
    caminhos absolutos de máquina.
-   Criar gerenciadores apenas quando necessários; não transformar cada
    objeto em um singleton.
-   Persistir progresso localmente com versão de esquema, tratamento de
    arquivo ausente/corrompido e valores padrão.
-   Não depender de rede, banco externo, login ou API para jogar.
-   Tratar erros com mensagens úteis. Não silenciar exceções ou erros de
    recursos.
-   Nomes de arquivos, classes e variáveis consistentes; comentários
    para decisões não óbvias.
-   Configurar resolução base, janela redimensionável e modo tela cheia.
-   Garantir desempenho estável em um computador comum, com opção de
    reduzir sombras/efeitos.

## 10. Áudio e apresentação

-   Criar mixagem básica com buses separados para Master, Music e SFX.
-   Efeitos de ataque sincronizados com o contato da arma, não apenas no
    início da animação.
-   Pequeno hit-stop e câmera tremida controlada em golpes pesados,
    críticos e chefe; permitir reduzir/desligar câmera tremida.
-   Usar partículas e flash de material de forma breve, evitando
    estrobos intensos.
-   Fazer transições entre menu, seleção, missão e resultado sem telas
    pretas acidentais.
-   Usar animações de entrada/saída para dar peso a personagens e
    inimigos.
-   Música e efeitos não devem competir com a leitura dos golpes.

## 11. Testes e validação obrigatória

Criar testes automatizados quando viável e uma checklist de smoke test.
Executar o projeto de verdade no ambiente disponível, não confiar
somente na inspeção do código.

Validar no mínimo: - Projeto importa e abre sem erro. - Menu principal
inicia e encerra o fluxo. - Seleção de herói altera o personagem
jogável. - Movimento respeita limites da arena. - Ataques acertam apenas
quando válidos e aplicam dano correto. - Cooldowns iniciam, avançam e
terminam. - Inimigo muda de estado e pode morrer. - Herói pode morrer e
a derrota é acionada. - Vitória só acontece quando os objetivos do
encontro são cumpridos. - Chefe executa padrões e pode ser derrotado. -
Recompensas são concedidas uma única vez. - Salvamento e carregamento
persistem progresso. - Pausa realmente congela combate. - Ajustes de
áudio são aplicados. - UI permanece legível em 1280×720 e 1920×1080. -
Nenhum botão principal está sem ação. - Nenhum recurso de arte ou áudio
referenciado está ausente.

Se não houver ambiente gráfico disponível, executar validações headless
possíveis e documentar claramente o que não foi validado visualmente.

## 12. Plano de execução do agente --- sem interromper para pedir confirmação

Execute as etapas abaixo de forma autônoma e conclua o máximo possível:

1.  **Inspecionar o ambiente:** identificar ferramentas disponíveis,
    versão do Godot, Blender e utilitários de imagem/áudio.
2.  **Planejar internamente:** transformar este documento em tarefas
    concretas e dependências. Não parar para devolver somente o plano.
3.  **Criar o projeto base:** configurar o Godot 4.x, cenas, input map,
    renderização, pastas e convenções.
4.  **Criar primeiro a vertical slice:** um herói, um inimigo, arena,
    câmera, ataque, dano, morte, HUD e resultado. Garantir que seja
    jogável.
5.  **Produzir assets autorais:** modelar personagens e cenário, criar
    materiais, rig e animações; implementar os efeitos e sons.
6.  **Expandir conteúdo:** completar os 3 heróis, inimigos, chefe,
    encontros e progressão.
7.  **Construir menus e salvamento:** ligar todos os botões e fluxos
    reais.
8.  **Polir:** iluminação, composição, partículas, áudio, transições,
    hit feedback e performance.
9.  **Testar:** executar os testes e corrigir os defeitos encontrados.
10. **Auditar:** procurar placeholders, botões sem ação, assets
    ausentes, erros, lógica duplicada e dependências externas.
11. **Documentar:** criar README com requisitos, instalação, execução,
    controles, arquitetura, produção de assets, testes e limitações
    conhecidas.
12. **Entregar:** informar os arquivos principais, como executar, o que
    foi implementado e os testes efetivamente realizados.

Não terminar depois de criar apenas a primeira cena. Se houver limite de
tempo/contexto, priorizar um jogo verticalmente completo e jogável, com
arte coerente e escopo fechado, em vez de dezenas de sistemas
incompletos.

## 13. README e entrega final

O `README.md` deve conter: - Visão geral e identidade do jogo. - Versão
do Godot e ferramentas necessárias. - Instruções de importação e
execução. - Controles. - Loop de gameplay e conteúdo implementado. -
Estrutura das pastas. - Como adicionar heróis, inimigos, habilidades e
encontros. - Como substituir/editar assets. - Licenças e atribuições. -
Testes executados e resultados reais. - Limitações conhecidas e itens
que ficaram pendentes.

Na resposta final do agente, apresentar: 1. resumo objetivo do jogo
entregue; 2. estrutura dos diretórios; 3. comando/instruções exatas para
executar; 4. lista de assets e animações efetivamente criados; 5. testes
executados e resultados; 6. limitações reais restantes.

**Regra final:** entregue um jogo 3D autoral, com direção de arte,
assets reais, animações, efeitos e um loop de combate completo. Não use
Canvas, não entregue uma demo genérica e não alegue que recursos existem
sem implementá-los.
