"""
Executor Module

This module defines a ProcessPoolExecutor for handling blocking operations.
"""
# backend/services/executor.py

from concurrent.futures import ThreadPoolExecutor
import os

# Initialize ThreadPoolExecutor
class GlobalExecutor:
    def __init__(self):
        self.executor = None

    def get_executor(self):
        if self.executor is None:
            self.executor = ThreadPoolExecutor(max_workers=os.cpu_count())
        return self.executor

    def shutdown(self):
        if self.executor:
            self.executor.shutdown()
            self.executor = None

global_executor = GlobalExecutor()
executor = global_executor.get_executor()
