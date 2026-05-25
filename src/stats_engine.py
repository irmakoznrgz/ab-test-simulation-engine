import statsmodels.stats.api as sms
from statsmodels.stats.proportion import proportion_confint
import scipy.stats as stats
import numpy as np
import math

def calculate_required_sample_size(base_rate: float, mde_relative: float, alpha: float = 0.05, power: float = 0.80):
    
    target_rate = base_rate * (1 + mde_relative)
    
    effect_size = sms.proportion_effectsize(base_rate, target_rate)
    
    sample_size = sms.NormalIndPower().solve_power(
        effect_size, 
        power=power, 
        alpha=alpha, 
        ratio=1.0
    )
    
    required_per_group = math.ceil(sample_size)
    
    return {
        "base_rate": base_rate,
        "target_rate": target_rate,
        "required_per_group": required_per_group,
        "total_required": required_per_group * 2
    }

def calculate_bayesian_ab_test(vis_A, conv_A, vis_B, conv_B):

    # Assuming initial values of alpha=1 and beta=1
    alpha_A = 1 + conv_A
    beta_A = 1 + (vis_A - conv_A)
    alpha_B = 1 + conv_B
    beta_B = 1 + (vis_B - conv_B)
    
    simulations = 100000
    samples_A = np.random.beta(alpha_A, beta_A, simulations)
    samples_B = np.random.beta(alpha_B, beta_B, simulations)
    
    probability_B_is_better = np.mean(samples_B > samples_A)
    
    expected_cr_A = np.mean(samples_A)
    expected_cr_B = np.mean(samples_B)
    expected_uplift = (expected_cr_B - expected_cr_A) / expected_cr_A
    
    return {
        "prob_B_is_better": round(float(probability_B_is_better), 4),
        "expected_uplift": round(float(expected_uplift), 4),
        "expected_cr_A": round(float(expected_cr_A), 4),
        "expected_cr_B": round(float(expected_cr_B), 4)
    }

def calculate_ab_test_results(stats_data, amounts_A, amounts_B):
    results = {}
    
    data_A = next((item for item in stats_data if item["group_name"] == "A"), {"visitors": 0, "conversions": 0})

    data_B = next((item for item in stats_data if item["group_name"] == "B"), {"visitors": 0, "conversions": 0})
    
    vis_A, conv_A = data_A["visitors"], data_A["conversions"]

    vis_B, conv_B = data_B["visitors"], data_B["conversions"]

    total_visitors = vis_A + vis_B
    
    if vis_A == 0 or vis_B == 0:
        return {"error": "Not enough data"}

    # (Conversion Rate)
    cr_A = conv_A / vis_A
    cr_B = conv_B / vis_B

    # 95% Confidence Intervals
    ci_lower_A, ci_upper_A = proportion_confint(conv_A, vis_A, alpha=0.05, method='normal')
    ci_lower_B, ci_upper_B = proportion_confint(conv_B, vis_B, alpha=0.05, method='normal')
    
    results["A"] = {"visitors": vis_A, "conversions": conv_A, "cr": round(cr_A, 4), "ci_95%": [round(ci_lower_A, 4), round(ci_upper_A, 4)]}

    results["B"] = {"visitors": vis_B, "conversions": conv_B, "cr":round(cr_B, 4), "ci_95%": [round(ci_lower_B, 4), round(ci_upper_B, 4)]}

    # SRM (Sample Ratio Mismatch)
    expected_A = total_visitors / 2
    expected_B = total_visitors / 2

    srm_stat, srm_p_value = stats.chisquare([vis_A, vis_B], f_exp=[expected_A, expected_B])

    results["srm_check"] = {
        "p_value": srm_p_value,
        "srm_detected": bool(srm_p_value < 0.05) 
    }

    # Chi-Square Test
    contingency_table = [
        [conv_A, vis_A - conv_A],
        [conv_B, vis_B - conv_B]
    ]
    
    if conv_A > 5 and conv_B > 5:
        chi2, p_val_cr, _, _ = stats.chi2_contingency(contingency_table)

        results["chi_square"] = {
            "p_value": p_val_cr,
            "significant": bool(p_val_cr < 0.05),
            "winner": "B" if (p_val_cr < 0.05 and cr_B > cr_A) else ("A" if p_val_cr < 0.05 else "None")
        }
    else:
        results["chi_square"] = {"p_value": None, "significant": False, "winner": "None"}
        
    # Independent T-Test (Average Order Value - AOV)
    if len(amounts_A) > 2 and len(amounts_B) > 2:
        aov_A = round(float(np.mean(amounts_A)), 2)
        aov_B = round(float(np.mean(amounts_B)), 2)
        
        t_stat, p_val_aov = stats.ttest_ind(amounts_A, amounts_B, equal_var=False) # Welch's t-test
        
        results["A"]["aov"] = aov_A
        results["B"]["aov"] = aov_B
        results["t_test"] = {
            "p_value": float(p_val_aov),
            "significant": bool(p_val_aov < 0.05)
        }
    else:
        results["A"]["aov"] = 0
        results["B"]["aov"] = 0
        results["t_test"] = {"p_value": None, "significant": False}

    results["bayesian_analysis"] = calculate_bayesian_ab_test(vis_A, conv_A, vis_B, conv_B)
    return results

