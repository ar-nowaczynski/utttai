import pathlib

import utttpy

UTTTPY_PATH = pathlib.Path(utttpy.__path__[0])
UTTT_PATH = UTTTPY_PATH.parent

UTTT_DATASETS_PATH = UTTT_PATH / "datasets"
UTTT_DATASET_STAGE1_PATH = UTTT_DATASETS_PATH / "stage1-mcts"
UTTT_DATASET_STAGE2_PATH = UTTT_DATASETS_PATH / "stage2-nmcts"
