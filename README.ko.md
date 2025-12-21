# Citation Helper (Firefox)

언어: [English](README.md) | 한국어 | [日本語](README.ja.md)

버전: v0.9.0 (0.9.0-beta)

Citation Helper는 지원되는 논문/기사 페이지에서 메타데이터를 추출해, 참고문헌을 생성하고 한 번에 복사/내보내기 할 수 있는 Firefox 확장입니다.

개인정보/데이터 처리: [PRIVACY.md](PRIVACY.md)

## 베타 배포 (AMO Unlisted)

이 버전은 AMO Unlisted(자체 배포용)로 서명된 XPI를 받아 설치하는 베타 배포 흐름을 전제로 합니다.
서명된 `.xpi` 파일을 받았다면 아래 방법으로 설치하세요.

## 지원 사이트

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

## 예시 URL

- PubMed: https://pubmed.ncbi.nlm.nih.gov/10238015/
- Nature: https://www.nature.com/articles/d41586-024-04246-9
- SpringerLink (article): https://link.springer.com/article/10.1007/s11192-024-05163-4
- SpringerLink (chapter): https://link.springer.com/chapter/10.1007/978-1-0716-1418-1_2

테스트 세트(픽스처 + policy 케이스): [0.8.5-cases.md](0.8.5-cases.md)

## 출력 형식

인용 스타일
- Vancouver
- APA 7
- IEEE

Export
- BibTeX
- CSL-JSON
- RIS

## 저자 프리셋

- Default: 사이트가 제공하는 형식을 우선 사용(가능한 범위에서 최선)
- Auto initials: 가능한 경우 이니셜 기반으로 저자 표기 생성
- Raw: 저자 문자열을 있는 그대로 유지

참고: BibTeX / CSL-JSON / RIS는 Default 프리셋을 사용합니다.

## 사용 방법

- 지원되는 논문 페이지를 엽니다.
- 확장 아이콘을 클릭합니다.
- **Fetch citation**을 클릭합니다.
- **Copy**를 클릭합니다.

## 설치 방법 (서명된 XPI)

- Firefox 애드온 관리자 열기 (`about:addons`)
- 톱니바퀴 메뉴 클릭
- **파일에서 부가 기능 설치…** 선택
- 서명된 `.xpi` 선택

## 제한 / 참고

- v0.9.0에서는 위의 사이트만 지원합니다.
- 메타데이터는 현재 페이지의 meta 태그/JSON-LD를 기반으로 추출합니다. 페이지에 없는 필드는 출력에도 포함되지 않습니다.
- 현재 탭만 대상으로 동작하며, PDF를 다운로드/파싱하지 않습니다.
- 모든 처리는 로컬에서 수행되며, 서버로 데이터를 보내지 않습니다.

## 권한(Permissions)

최소 권한을 목표로 합니다.

- `activeTab`: 사용 시점에 현재 탭만 접근
- `storage`: 설정(uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion) 로컬 저장
- `clipboardWrite`: 결과를 클립보드로 복사

호스트 접근은 content script의 matches로 지원 사이트에만 제한됩니다.

## 개발

의존성 설치
```bash
npm install
```

formatter 스냅샷 갱신
```bash
npm run test:update
```

테스트 실행
```bash
npm test
```

Firefox에서 실행(임시 확장)
```bash
npx web-ext run
```

AMO 업로드용 zip 빌드
```bash
npx web-ext build --overwrite-dest
```

## 버그 리포트 / 피드백

버그 리포트에는 가능하면 아래를 포함해 주세요.

- URL
- 기대 결과 vs 실제 결과
- 사용한 출력 형식과 저자 프리셋
- (선택) 페이지 메타데이터/인용 영역 스크린샷

## 라이선스

리포지토리의 라이선스 파일(있다면)을 확인해 주세요.
