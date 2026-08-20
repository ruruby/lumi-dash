# vault 경로 이탈 차단이 불명확한 500으로 보고된다

## 증상

`GET /api/vault?path=<vault>&folder=..` 처럼 vault 바깥을 가리키는 folder를 요청하면, 차단은 정상적으로 되지만 응답이 `{"error":"vault를 읽는 중 문제가 발생했어요."}` (HTTP 500)로 나온다. 원인이 경로 이탈이라는 사실이 드러나지 않고, 서버 로그에도 예상치 못한 오류처럼 기록된다.

## 증거

curl로 확인:

```
curl "http://localhost:3000/api/vault?path=<vault>&folder=.."
{"error":"vault를 읽는 중 문제가 발생했어요."}
```

차단 자체는 `lib/vault.ts`의 `resolveScope`가 정상 수행한다. 노트가 유출되지는 않는다.

## 추정 원인

`resolveScope`가 던지는 `Error`에는 `errno` 코드가 없어서, `app/api/vault/route.ts`의 `errorResponse`가 ENOENT/EACCES/ENOTDIR 분기를 모두 지나쳐 마지막 500 분기로 떨어진다.

## 왜 지금 고치지 않았나

UI에서 folder 값은 실제 하위 폴더 목록 드롭다운에서만 오기 때문에, 일반적인 사용 경로로는 도달하지 않는다. 프로젝트의 리뷰 예산상 수용 기준을 깨거나 주 경로가 깨지는 것만 고치기로 되어 있어 기록만 남긴다.

## 제안하는 다음 단계

`resolveScope`가 구분 가능한 오류(예: 전용 에러 클래스나 `code` 필드)를 던지게 하고, `errorResponse`에서 그것을 400과 "vault 바깥의 폴더는 열 수 없어요." 메시지로 매핑한다.
