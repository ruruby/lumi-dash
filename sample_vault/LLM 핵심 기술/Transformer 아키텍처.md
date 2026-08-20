---
tags: [LLM, architecture, transformer]
updated: 2026-08-19
---

# Transformer 아키텍처

Transformer는 self-attention으로 토큰 사이의 의존성을 병렬 계산하는 LLM의 기본 구조다. 현재의 관심은 단순한 파라미터 확대보다 제한된 연산 예산을 어디에 배분할지에 있다.

## 핵심 관찰

- Grouped-query attention과 multi-query attention은 KV cache 크기를 줄여 추론 처리량을 높인다.
- Mixture of Experts는 토큰마다 일부 expert만 활성화해 총 파라미터와 실제 연산량을 분리한다.
- 긴 문맥에서는 위치 표현, attention 비용, 문맥 내 정보 검색 정확도가 함께 병목이 된다.

## 연결

구조 선택은 [[효율적인 추론]]의 메모리 사용량을 결정하고, 긴 문맥의 한계는 외부 지식을 가져오는 [[검색 증강 생성]]의 필요성과 맞닿아 있다. 모델이 구조적으로 좋아져도 실제 품질은 [[LLM 평가]]로 분리해 확인해야 한다.

## 현재 판단

범용 모델을 처음부터 학습하기보다는 공개 모델을 목적에 맞게 선택하고 추론 비용을 측정하는 편이 현실적이다. 다음 조사에서는 동일 품질 기준에서 dense 모델과 MoE 모델의 지연시간을 비교한다.
