# Citation Helper (Firefox) - v0.7.0

지원되는 논문 페이지에서 참고문헌 인용을 생성하고 복사할 수 있는 파이어폭스 확장 프로그램입니다.

## 지원 사이트
- PubMed - https://pubmed.ncbi.nlm.nih.gov/<PMID>/
- Nature.com - https://www.nature.com/articles/<ARTICLE_ID>

## 지원 형식
- Vancouver
- APA 7판
- IEEE
- BibTeX

## 사용 방법
1. 지원되는 논문 페이지(PubMed 또는 Nature)를 엽니다.
2. 확장 아이콘을 눌러 팝업을 엽니다.
3. 형식을 선택한 뒤 생성합니다.
4. Copy로 클립보드에 복사합니다.

## 디버그 모드(테스트용 JSON 추출)
디버그 모드를 켜면 마지막으로 추출된 CitationData가 브라우저 저장소에 저장됩니다.
회귀 테스트용 fixture(JSON)를 만들 때 사용합니다.

켜기:
- 확장 팝업 DevTools 콘솔에서 실행
  browser.storage.local.set({ debugMode: true })

확인:
- browser.storage.local.get(["lastCitationUrl","lastCitationData","lastCitationAt"]).then(console.log)

## 테스트(스냅샷 방식)
사이트를 추가하거나 extractor를 수정할 때 PubMed/Nature가 깨지지 않도록 fixtures + snapshot 테스트를 사용합니다.

실행:
- npm test

스냅샷 생성/갱신:
- npm test -- --update

## 설계 원칙
- formatters는 사이트와 무관하게 안정적으로 유지합니다.
- 사이트별 차이는 extractor + 정규화 계층에서 해결합니다.
- 모든 extractor는 공통 CitationData 스키마로 출력합니다.

## CitationData 스키마(핵심 필드)
- authors: string[]
- title: string
- journalFull: string
- journalAbbrev: string(선택)
- year, volume, issue, pages
- pmid(PubMed 전용)
- doi(선택)
- url