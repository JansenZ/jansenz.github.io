// 最大子序和
// 动态规划
var maxSubArray = function (nums) {
    if (!nums.length) return null;
    let dp = [nums[0]];
    let max = nums[0];
    for (let i = 1; i < nums.length; i++) {
        dp[i] = Math.max(dp[i - 1] + nums[i] , nums[i]);
        if (max < dp[i]) max = dp[i];
    }
    return max;
}