# Citation Helper

언어:
- English (README.md)
- 한국어 (README.ko.md)
- 日本語 (README.ja.md)

Citation Helper는 지원되는 논문 상세 페이지에서 인용 정보를 추출하고, 참고문헌 형식으로 변환해주는 Firefox 확장 프로그램입니다.

이 프로젝트는 지원 사이트 수를 늘리는 것보다, 형식 정확성과 안정성을 우선합니다.

## 주요 기능

- 지원 사이트 논문 페이지에서 인용 정보 추출
- 인용 형식:
  - Vancouver
  - APA 7판
  - IEEE
  - BibTeX
- 저자 규칙 처리:
  - Vancouver et al. 처리
  - APA 7 21명 이상 축약 규칙
- DOI, PMID, pages, eLocator 처리(가능한 경우)
- UI 다국어: 영어, 한국어, 일본어
- 원클릭 복사

## 지원 사이트

- PubMed
  - https://pubmed.ncbi.nlm.nih.gov/
- Nature (nature.com)
  - https://www.nature.com/ (논문 페이지)

지원 범위는 의도적으로 좁게 유지합니다. 사이트를 추가할 때는 테스트 세트를 먼저 만들고, 기존 사이트가 깨지지 않도록 단계적으로 확장합니다.

## 사용 방법

1. 지원되는 논문 상세 페이지를 엽니다.
2. 확장 아이콘을 클릭합니다.
3. 인용 형식과 언어를 선택합니다.
4. 인용 불러오기를 누릅니다.
5. 복사하기로 복사합니다.

## 개인정보/네트워크 정책

- 인용 데이터는 브라우저 내부에서 로컬로 처리됩니다.
- 분석/추적 기능이 없습니다.
- 페이지 내용이 외부 서버로 전송되지 않습니다.
- 클립보드는 사용자가 복사하기를 눌렀을 때만 사용합니다.

## 개발용 설치 (Firefox)

1. about:debugging 열기
2. This Firefox
3. Load Temporary Add-on…
4. manifest.json 선택

## 라이선스

MIT License