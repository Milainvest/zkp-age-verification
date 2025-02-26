pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";

template AgeCheck() {
    signal input birthYear;
    signal input birthMonth;
    signal input birthDay;
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal output isAdult;

    // Calculate age
    signal yearDiff <== currentYear - birthYear;

    // 年齢が18歳以上かどうかの判定
    component isOver18 = GreaterEqThan(12); // 12は年の差を比較するのに十分なビット数
    isOver18.in[0] <== yearDiff;
    isOver18.in[1] <== 18;
    signal is18OrOlder <== isOver18.out;

    // 月と日の比較 (18歳ちょうどの場合のみ必要)
    component isSameOrLaterMonth = GreaterEqThan(4); // 4ビットあれば月は表現可能
    isSameOrLaterMonth.in[0] <== currentMonth;
    isSameOrLaterMonth.in[1] <== birthMonth;
    signal isMonthGreaterOrEqual <== isSameOrLaterMonth.out;

    component isSameOrLaterDay = GreaterEqThan(5);   // 5ビットあれば日は表現可能
    isSameOrLaterDay.in[0] <== currentDay;
    isSameOrLaterDay.in[1] <== birthDay;
    signal isDayGreaterOrEqual <== isSameOrLaterDay.out;

    // 年齢がちょうど18歳かどうかの判定
    component isExactly18 = IsZero(); //IsZeroコンポーネントを使用
    isExactly18.in <== 18 - yearDiff; //年が18と等しければ0になる
    signal is18Exactly <== isExactly18.out;
    log("is18Exactly", is18Exactly);

    // 18歳以上、または18歳で誕生日が現在日以降の場合にtrue
    signal monthDayCheck <== isMonthGreaterOrEqual * isDayGreaterOrEqual; // 中間変数
    isAdult <== is18OrOlder + (is18Exactly * monthDayCheck);
    log("isAdult", isAdult);
}

component main = AgeCheck();