/**
 * 숫자 뒤 조사를 고른다.
 *
 * 알고리즘 탭은 문장에 숫자가 계속 박힌다(`31이 찾는 42일까요?`).
 * 문자열을 그냥 이으면 `31 가 42 보다` 같은 문장이 나온다.
 *
 * 받침 판단은 **마지막 자리를 읽는 소리**로 한다.
 * 영(0)·일(1)·삼(3)·육(6)·칠(7)·팔(8) 은 받침이 있고,
 * 이(2)·사(4)·오(5)·구(9) 는 없다.
 */
const HAS_BATCHIM = [true, true, false, true, false, false, true, true, true, false];

export function josa(n: number, withBatchim: string, withoutBatchim: string): string {
  const last = Math.abs(n % 10);
  // ㄹ 받침(일·칠·팔 = 1·7·8)에는 "으로" 가 아니라 "로" 를 쓴다
  if (withBatchim === "으로" && (last === 1 || last === 7 || last === 8)) return `${n}${withoutBatchim}`;
  return `${n}${HAS_BATCHIM[last] ? withBatchim : withoutBatchim}`;
}
