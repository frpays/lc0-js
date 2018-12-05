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

#pragma once

#include <cstddef>


enum MatrixFormat {
  ColMajor,
  RowMajor
};

// C←αAB + βC
// M Number of rows in matrices A and C.
// N Number of columns in matrices B and C.
// K Number of columns in matrix A; number of rows in matrix B.


template<typename T, MatrixFormat fA,  MatrixFormat fB, MatrixFormat fC>
void MatrixMultiply(size_t M, size_t N, size_t K,
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

template<typename T, MatrixFormat fA,  MatrixFormat fB, MatrixFormat fC>
void MatrixMultiply_try(size_t M, size_t N, size_t K,
                       const T* A, const T* B,  T* C) {
  
  const size_t D=32;
  
  memset(C, 0, N*M*sizeof(T));
  
  for (size_t tk=0; tk<N; tk+=D) {
    
    size_t tke=tk+D;
    if (tke>N)
      tke=N;
    
    for (size_t ti=0; ti<M; ti+=D) {
      
      size_t tie=ti+D;
      if (tie>M)
        tie=M;
      
      for (size_t tj=0; tj<K; tj+=D) {
        
        size_t tje=tj+D;
        if (tje>K)
          tje=K;
        
        for (size_t k=tk; k<tke; k++) {
          for (size_t i=ti; i<tie; i++) {
            T acc=0;
            for (size_t j=tj; j<tje; j++) {
              acc+=A[fA==ColMajor ? i+M*j : i*K+j]*B[fB==ColMajor ? j+K*k : j*N+k];
            }
            C[fC==ColMajor ? i+M*k : i*N+k]+=acc;
          }
        }
      }
    }
  }
}




