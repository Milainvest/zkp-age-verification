// Circomlibのコンパレータを利用するためにinclude
include "../node_modules/circomlib/circuits/comparators.circom";

template AgeCheck() {
    // 入力: ユーザーの生年月日 (YYYYMMDD を整数値として受け取る)
    signal input birthDate;
    // 入力: 現在の日付 (YYYYMMDD)
    signal input currentDate;
    // 出力: 18歳以上なら1, そうでなければ0
    signal output isAdult;

    // 現在日付 - 生年月日 = 生存日数（簡略計算）
    signal diff;
    diff <== currentDate - birthDate;

    // 18年間に相当する日数 (18 * 365 = 6570)
    component c = LessEqThan(18);  // 18ビットで比較
    c.in[0] <== 6570;  // 閾値: 18年に相当する日数
    c.in[1] <== diff;  // 実際の経過日数

    // 出力: 18歳以上なら1、そうでなければ0
    isAdult <== c.out;
}

// メインコンポーネント
component main = AgeCheck();