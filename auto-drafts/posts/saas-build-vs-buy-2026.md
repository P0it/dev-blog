---
title: SaaS 안 사고 직접 만든다는 32%, 지출은 15% 늘었다
slug: saas-build-vs-buy-2026
tags: [B2B SaaS, Customer Success]
category: insights
---

> 소프트웨어를 사는 대신 직접 만들었다는 기업이 세 곳 중 하나입니다. 그런데 같은 해 소프트웨어 지출 전망은 오히려 올랐습니다. 구매가 줄어든 게 아니라 조달 장부 밖으로 옮겨 간 겁니다.

## 세 곳 중 하나가 구매를 접었다는 조사

McKinsey가 8월 25일 공개한 [State of AI 2026 조사](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)에서 응답자 32%가 agentic coding 도구로 내부에서 만들 수 있어 소프트웨어 제품이나 기능을 사지 않기로 했다고 답했습니다. 97개국 1,719명을 5월 4일부터 6월 8일까지 조사한 결과입니다. 업종을 나눠 보면 기술이 39%, 헬스케어와 전문서비스가 각각 38%로 더 높았습니다.

Retool이 2월 17일 낸 [Build vs. Buy 보고서](https://www.businesswire.com/news/home/20260217548274/en/Retools-2026-Build-vs.-Buy-Report-Reveals-35-of-Enterprises-Have-Already-Replaced-SaaS-With-Custom-Software)도 같은 쪽을 가리킵니다. 817명 응답자 중 35%는 이미 SaaS 도구를 하나 이상 자체 제작으로 갈아치웠고, 78%는 올해 사내 도구를 더 만들 계획이라고 답했습니다.

두 조사만 놓고 보면 결론은 하나입니다. 기업이 SaaS를 떠나고 있다는 것이죠.

## 같은 해 소프트웨어 지출 전망은 오히려 올랐다

그런데 Gartner는 7월 27일 2026년 전 세계 IT 지출 전망을 [6조 3,700억 달러, 14.2% 성장](https://www.gartner.com/en/newsroom/press-releases/2026-07-27-gartner-forecasts-worldwide-it-spending-to-grow-14-point-2-percent-in-2026-totaling-6-point-37-trillion)으로 올려 잡았습니다. [SaaStr가 정리한 세부 항목](https://www.saastr.com/gartner-software-spend-now-1-44-trillion-in-2026-revised-back-up-to-15-1-the-slowdown-never-came-are-you-grabbing-it/)을 보면 소프트웨어 부문만 1조 4,400억 달러에 15.1% 성장입니다. 연초에 한 번 깎였던 전망이 도로 회복된 수치입니다.

세 곳 중 하나가 구매를 접었다는 조사와, 소프트웨어 지출이 15% 늘어난다는 전망이 같은 해에 나란히 서 있습니다. 둘 중 하나를 틀렸다고 밀어내기는 어렵습니다. 표본도 방법도 다르고, 재고 있는 대상도 다르거든요.

## 줄어든 건 결재선을 타는 구매다

제 결론은 이렇습니다. 구매가 사라진 게 아니라 구매의 **경계**가 옮겨 갔습니다.

근거는 Retool 보고서 안에 있습니다. 응답자들이 만든 자체 도구의 **60%가** 공식 조달 절차를 거치지 않았습니다. Retool은 이를 shadow IT라고 불렀습니다. 조달 창구에서 보면 그 60%는 처음부터 존재하지 않는 수요입니다. 견적 요청이 오지 않았으니 검토 목록에도 오르지 않습니다.

벤더 쪽에서는 사정이 더 나쁩니다. 계약이 끊기는 것이 아니라 다음 계약이 시작되지 않습니다. 갱신 협상 테이블에는 아무 일도 없어 보이는데, 실제 결정은 그보다 한참 앞에서 어느 팀이 만든 내부 도구로 이미 끝나 있습니다.

```visual
{
  "pattern": "stat-card",
  "alt": "구매를 접었다는 응답 32퍼센트, 조달 절차 밖에서 만들어진 자체 도구 60퍼센트, 그럼에도 15.1퍼센트 늘어나는 소프트웨어 지출",
  "stats": [
    { "value": "32%", "label": "구매를 접었다", "caption": "McKinsey · 1,719명", "icon": "ban", "accent": "danger" },
    { "value": "60%", "label": "조달 밖에서 제작", "caption": "Retool · shadow IT", "icon": "eye", "accent": "warn" },
    { "value": "15.1%", "label": "소프트웨어 지출", "caption": "Gartner 2026 전망", "icon": "trending-up", "accent": "success" }
  ]
}
```

## 만드는 속도와 손익 사이의 시차

같은 McKinsey 조사에서 AI가 EBIT에 어떤 형태로든 영향을 준다고 답한 비율은 37%였습니다. 1년 전과 사실상 같은 수치라고 McKinsey는 적었습니다. AI로 EBIT의 5% 이상을 만든다고 답한 상위 집단은 전체 응답자의 6%였고, 이들 중 절반 가까이가 소프트웨어 구매를 건너뛰었습니다. 나머지 응답자에서는 31%였습니다.

만드는 속도가 빨라진 것은 분명합니다. 그 속도가 손익까지 닿은 흔적은 아직 늘지 않았습니다. 저는 이걸 만들기와 굴리기 사이의 시차로 읽습니다. 도구가 줄여 준 것은 첫 버전까지의 거리지, 그 뒤 3년치 운영이 아니니까요.

## 진짜 대체라는 반론

여기에 대한 반론은 분명합니다. 지금 벌어지는 일이 경계 이동이 아니라 실제 대체라는 겁니다. SaaS 계약의 총소유비용이 표시 가격보다 훨씬 크고, 자체 제작의 연간 유지보수가 초기 구축비의 15~20% 선에서 예측 가능하다면, 계산기를 두드린 결과가 자체 제작으로 나오는 게 이상하지 않습니다. Retool 응답자의 78%가 더 만들겠다고 답한 것도 이 방향입니다.

이 반론이 맞다면 소프트웨어 지출은 줄어야 합니다. 줄지 않았습니다. SaaStr는 늘어난 지출의 상당 부분이 가격 인상과 AI 애플리케이션으로 흘러간다고 읽었는데, 그렇다면 기업들은 한쪽에서 도구를 만들면서 다른 쪽에서 더 비싼 계약을 맺고 있습니다. 대체보다는 품목이 바뀌는 쪽입니다.

한 가지는 인정해야 합니다. 워크플로 자동화나 사내 관리 도구처럼 좌석 수로 값을 매기던 영역에서는 대체가 실제로 일어나고 있습니다. 다만 그 영역이 소프트웨어 시장 전체는 아닙니다.

## 갱신 지표로는 안 잡히는 이탈

이 관점에서 보면 고객 성공 쪽이 보는 지표는 한 박자 늦습니다. 로그인 빈도, 티켓 수, NPS는 모두 **쓰고 있는 고객**을 측정합니다. 반면 여기서 벌어지는 이탈은 쓰지 않기로 한 팀에서 시작하고, 그 팀은 조달 절차를 거치지 않았으니 벤더 쪽에 기록을 하나도 남기지 않습니다.

그래서 벤더가 팔아야 하는 것도 달라집니다. 기능은 이제 며칠이면 복제됩니다. 복제되지 않는 쪽은 그 기능을 3년간 굴리는 책임입니다. 장애가 났을 때 누가 새벽에 일어나는지, 규제가 바뀌면 누가 대응하는지, 만든 사람이 나가면 누가 이어받는지. 32%가 건너뛴 것은 구매 결정이지 이 질문들이 아닙니다.

## 참고 자료

- [The State of AI: Global Survey 2026 — McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai) (2026-08-25)
- [Retool's 2026 Build vs. Buy Report — Business Wire](https://www.businesswire.com/news/home/20260217548274/en/Retools-2026-Build-vs.-Buy-Report-Reveals-35-of-Enterprises-Have-Already-Replaced-SaaS-With-Custom-Software) (2026-02-17)
- [Gartner Forecasts Worldwide IT Spending to Grow 14.2% in 2026 — Gartner](https://www.gartner.com/en/newsroom/press-releases/2026-07-27-gartner-forecasts-worldwide-it-spending-to-grow-14-point-2-percent-in-2026-totaling-6-point-37-trillion) (2026-07-27)
- [Gartner: Software Spend Now $1.44 Trillion in 2026 — SaaStr](https://www.saastr.com/gartner-software-spend-now-1-44-trillion-in-2026-revised-back-up-to-15-1-the-slowdown-never-came-are-you-grabbing-it/)
