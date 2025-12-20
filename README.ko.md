# Citation Helper (Firefox)

언어: [English](README.md) | 한국어 | [日本語](README.ja.md)

버전: v0.8.4

Citation Helper는 지원되는 논문 페이지에서 참고문헌 인용을 생성하고, 한 번에 복사할 수 있게 해주는 Firefox 확장 프로그램입니다.

개인정보/정책: [PRIVACY.md](PRIVACY.md)

## 지원 사이트

- PubMed (pubmed.ncbi.nlm.nih.gov)
- Nature (nature.com)
- SpringerLink (link.springer.com)

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

- Default: 사이트가 제공하는 저자 표기(또는 가능한 최선의 표기)를 사용
- Auto initials: 가능한 경우 이니셜 기반 저자 목록을 자동 생성
- Raw: 저자 문자열을 그대로 유지

참고: BibTeX / CSL-JSON / RIS는 Default 프리셋을 사용합니다.

## 사용 방법

1. 지원되는 논문 상세 페이지를 엽니다.
2. 확장 아이콘을 클릭합니다.
3. **Fetch citation**을 클릭합니다.
4. **Copy**를 클릭합니다.

## 권한

권한을 최소화하는 방향으로 구성되어 있습니다.

- activeTab: 사용자가 확장을 사용할 때 현재 탭만 접근
- storage: 설정을 로컬에 저장(uiLanguage, citationStyle, authorPreset, debugMode, settingsVersion)
- clipboardWrite: 결과를 클립보드에 복사

호스트 접근은 content script의 matches로 지원 사이트에만 제한됩니다.

## 개발

의존성 설치
```bash
npm install
```

formatter 스냅샷 업데이트
```bash
npm run test:update
```

테스트 실행(환경에 따라)
```bash
npm test
```

## 참고

- 모든 설정은 로컬에만 저장됩니다.
- 확장 프로그램은 외부 네트워크 요청을 하지 않습니다.

## 라이선스

레포지토리에 라이선스 파일이 있다면 해당 파일을 참고하세요.
