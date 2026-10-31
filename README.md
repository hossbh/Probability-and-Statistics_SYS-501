# Probability and Statistics for Engineers (SYS-501)

Applied probability and statistics worked in Python: descriptive statistics, probability distributions, Monte Carlo simulation, confidence intervals and hypothesis tests. Several problems use a real-world survey of Tesla battery degradation.

## Notebooks

| Notebook | What it does | Key result |
|---|---|---|
| [Descriptive Statistics: Tesla Battery Range](01_tesla%20visualization.ipynb) | Explores how far Tesla vehicles can travel on a full charge, using a crowd-sourced survey of owners. | The typical full-charge range is about 240 mi (mean 241.8, median 238). 80 % of vehicles fall below 256 mi, and range declines slightly with mileage. |
| [Probability Distributions in Practice](02_probability%20distributions.ipynb) | Four applied problems: café arrivals (Poisson), pooled blood testing (binomial and Poisson), shaft-diameter tolerances (normal) and motorcycle reliability (exponential and Weibull). | About 10 % of shafts fall outside a ±0.005 in tolerance, and σ must drop to about 0.0019 in for ≤ 1 % defects. |
| [Monte Carlo Simulation and Correlation](03_simulation.ipynb) | Poisson modelling of airline accidents, covariance and correlation of battery capacity with mileage, and Monte Carlo simulation of a dart game and of ambulance response distances. | Battery capacity and mileage are moderately negatively correlated (r = −0.58), and the correlation does not depend on the mileage unit. |
| [Estimation and Hypothesis Testing](04_DE.ipynb) | Confidence intervals for the mean and variance of remaining battery capacity, sample-size planning for repeated measurements, and a comparison of gasoline prices between two cities. | There is no significant difference in mean gas price (Welch p = 0.24), but the variances differ strongly (ratio 16.8). |

## Tech stack

Python 3 · Jupyter · `numpy` · `pandas` · `matplotlib` · `seaborn` · `scipy`

## Run it

```bash
pip install -r requirements.txt
jupyter notebook
```

**Data:** the datasets are not included in this repository. You need `tesla.csv`, `teslaData-sys501.csv` (Tesla owners' battery-degradation survey) and `gasoline_data.csv`. Place them next to the notebooks before running.

## About

This work was written by **Hossein Basereh** as part of graduate coursework (SYS-501 Probability and Statistics) and is shared as a portfolio of applied analysis. If you are taking a similar course, please follow your institution's academic-integrity policy.

## Licence

Copyright © 2023-2026 Hossein Basereh. The code is released under the [MIT License](LICENSE): you may reuse it with attribution, and it is provided "as is", without warranty. Assignment prompts quoted in the notebooks and any third-party datasets remain the property of their original authors and are not covered by this licence.
