/*
 This file is part of Leela Chess Zero.
 Copyright (C) 2018 The LCZero Authors
 
 Leela Chess is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.
 
 Leela Chess is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with Leela Chess.  If not, see <http://www.gnu.org/licenses/>.
 */

#include "neural/blas/blas.h"

/*

// C←αAB + βC
// M Number of rows in matrices A and C.
// N Number of columns in matrices B and C.
// K Number of columns in matrix A; number of rows in matrix B.
template<typename T>
void MatrixMultiply(size_t M, size_t N, size_t K,
                    MatrixFormat fA, MatrixFormat fB, MatrixFormat fC,
                    const T* A, const T* B,  T* C) {
  
  
  for (size_t k=0; k<N; k++) {
    for (size_t i=0; i<M; i++) {
      T acc=0;
      for (size_t j=0; j<K; j++) {
        acc+=A[fA==ColMajor ? i+M*j : i*K+j]*B[fB==ColMajor ? j+K*k : j*N+k];
      }
      C[fC==ColMajor ? i+M*k : i*N+k]=acc;
    }
  }
}

  template
  void MatrixMultiply<float>(size_t M, size_t N, size_t K,
                      MatrixFormat fA, MatrixFormat fB, MatrixFormat fC,
                      const float* A, const float* B,  float* C);
  
  
/*
 MatrixMultiply(output_size, batch_size, input_size, ColMajor, RowMajor, ColMajor, weights, inputs, outputs);

 for (size_t k=0; k<batch_size; k++) {
 for (size_t i=0; i<output_size; i++) {
 float acc=0;
 for (size_t j=0; j<input_size; j++) {
 acc+=weights[i*input_size+j]*inputs[j+input_size*k];
 }
 outputs[i+output_size*k]=acc;
 }
 }


 */

