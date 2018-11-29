

#include "blas.h"

#include "f2c.h"



/*
 
 typedef enum CBLAS_ORDER     {CblasRowMajor=101, CblasColMajor=102} CBLAS_ORDER;
 typedef enum CBLAS_TRANSPOSE {CblasNoTrans=111, CblasTrans=112, CblasConjTrans=113, CblasConjNoTrans=114} CBLAS_TRANSPOSE;
 typedef enum CBLAS_UPLO      {CblasUpper=121, CblasLower=122} CBLAS_UPLO;
 typedef enum CBLAS_DIAG      {CblasNonUnit=131, CblasUnit=132} CBLAS_DIAG;
 typedef enum CBLAS_SIDE      {CblasLeft=141, CblasRight=142} CBLAS_SIDE;
 
 */


char getTranspose(int value) {
  
  char c=' ';
  switch (value) {
      
    case CblasNoTrans:
      c='N';
      break;
      
    case CblasTrans:
      c='T';
      break;
      
  }
  return c;
  
}


void sgemm_(char *transa, char *transb, integer *m, integer *
            n, integer *k, real *alpha, real *a, integer *lda, real *b, integer *
            ldb, real *beta, real *c, integer *ldc);



void cblas_sgemm(const enum CBLAS_ORDER Order, const enum CBLAS_TRANSPOSE TransA, const enum CBLAS_TRANSPOSE TransB, const int M, const int N, const int K,
                 const float alpha, const float *A, const int lda, const float *B, const int ldb, const float beta, float *C, const int ldc)
{
  char TA=getTranspose(TransA);
  char TB=getTranspose(TransB);
  real _alpha=alpha;
  real _beta=beta;
  integer m=M;
  integer n=N;
  integer k=K;
  integer _lda=lda;
  integer _ldb=ldb;
  integer _ldc=ldc;
  
  
  if (Order == CblasColMajor)
    sgemm_(&TA, &TB, &m, &n, &k, &_alpha, A, &_lda, B, &_ldb, &_beta, C, &_ldc);
  else
    sgemm_(&TB, &TA, &n, &m, &k, &_alpha, B, &_ldb, A, &_lda, &_beta, C, &_ldc);
  
}


void sgemv_(char *trans, integer *m, integer *n, real *alpha,
            real *a, integer *lda, real *x, integer *incx, real *beta, real *y,
            integer *incy);



void cblas_sgemv(const enum CBLAS_ORDER order,  const enum CBLAS_TRANSPOSE trans,  const int M, const int N,
                 const float alpha, const float  *A, const int lda,  const float  *x,
                 const int incX,  const float beta,  float  *y, const int incY) {
  
  char T=getTranspose(trans);
  integer m=M;
  integer n=N;
  real _alpha=alpha;
  real _beta=beta;
  integer _lda=lda;
  integer incx=incX;
  integer incy=incY;
  
  if (order == CblasColMajor)
    sgemv_(&T, &m, &n, &_alpha, A, &_lda, x, &incx, &_beta, y, &incy);
  else
  {
    if (trans == CblasNoTrans)
      sgemv_("T", &n, &m, &_alpha, A, &_lda, x, &incx, &_beta, y, &incy);
    else
      sgemv_("N", &n, &m, &_alpha, A, &_lda, x, &incx, &_beta, y, &incy);
  }
  
  
}
float sdot_(integer *n, real *sx, integer *incx, real *sy, integer *incy);


float cblas_sdot(const int N, const float  *x, const int incX, const float  *y, const int incY) {
  integer n=N;
    integer incx=incX;
  integer incy=incY;
 return sdot_(&n, x, &incx, y, &incy);
}


