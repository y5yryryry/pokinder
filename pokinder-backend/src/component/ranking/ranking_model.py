from dataclasses import dataclass

from src.component.fusion.fusion_table import Fusion


@dataclass
class Ranking:
    fusion: Fusion
    count: int
    score: int
    rank: int
