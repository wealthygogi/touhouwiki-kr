docs/v3 폴더의 리팩토링을 수행하고 있고, ~/git/touhou-backup/thpatch-data 의 데이터를 기준으로 캐릭터, 대사집, 스펠카드, 뮤직룸을 꾸미고 있었어.

아래의 ko.md파일을 찾아야해. 아래 폴더가 대상이야.
~/git/touhou-backup/thpatch-data/Th06 ~ ~/git/touhou-backup/thpatch-data/Th20
Thxxx같은 외전 작품도 포함되는거야. 각 폴더의 내부는 아래와 같이 구성되어있어.

- 캐릭터 소개는 다음의 파일에 있다.
  - character*.txt
  - omake.txt
- 게임의 간단한 정보나 제작자의 글 등은 omake.txt에 있다.
- 스펠카드
  - Spell_cards 폴더
- 뮤직룸
  - Music 폴더
- 대사집
  - Endings, Extra, Scenario, Extra_and_Phantasm(th07) 등등의 폴더는 대사집에 해당한다.
  - 대사집의 형태는 각 시리즈마다 다르다. 위에서 언급한, omake, character, spell_cards, music 폴더는 대부분 동일하다.
  - 팀으로 이루어져있는 경우도 있고, 한 캐릭터가 A, B, C타입을 가지는 경우도 있고, 다양한 케이스가 존재한다.
- Images* 폴더는 범위에 해당하지 않는다.
- index* 폴더도 범위에 해당하지 않는다.
- Trophies*, Gem_Description, Abilities*등등은 자율적으로 맡긴다. 우선 순위는 낮으나 파싱이 가능하면 좋다.
- 정리하면 위의 구성을 통해서 캐릭터, 대사집, 스펠카드, 뮤직룸을 꾸미는 작업을 수행해야한다.

아래는 작업을 하면서 지켜야할 규칙이야.

- 데이터 변환 작업 및 검증, mdx파일로 변환. 특히 대사집이 누가 했는지 알 수 있도록, 줄바꿈과 띄어쓰기. 특수문자등의 문제를 잘 해결할 수 있도록.
  - 변환하기 전에 먼저 위의 포멧을 확인하고 어떤 템플릿으로 만들어야겠다. 를 생각하고 결정할 수 있도록 한다. 예를 들어, 각 시리즈마다 한 캐릭터의 대사집을 파악하고, 어떤 형태로 포멧을 만들지 구상한다.
- mdx포멧에서 이쁘게 만들어줄 수 있는 component제작
- npm run build를 통해서 제대로 컴파일이 되는지 확인
- commit작업은 진행하지 않을 것
- 최종 자동화 스크립트만 남기고 scripts 폴더는 삭제할것.
- 언어는 되도록 python으로 제작

작업을 완수해줘.
