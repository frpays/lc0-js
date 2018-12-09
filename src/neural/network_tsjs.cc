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

#include "neural/factory.h"
#include "neural/network.h"
#include "neural/blas/fully_connected_layer.h"

#include <algorithm>
#include <cassert>
#include <cmath>

#ifdef EMSCRIPTEN

#include <emscripten.h>
#include <emscripten/bind.h>

extern "C" {
  
  extern float lczero_forward(size_t batch_count, size_t input, size_t policy, size_t value);
  
}
#endif


namespace lczero {
  
// Bridge to tensorflowJS.

class TSJSComputation : public NetworkComputation {
 public:
  TSJSComputation(const Weights& weights, const size_t max_batch_size);

  virtual ~TSJSComputation() {}

  // Adds a sample to the batch.
  void AddInput(InputPlanes&& input) override { planes_.emplace_back(input); }

  // Do the computation.
  void ComputeBlocking() override;

  // Returns how many times AddInput() was called.
  int GetBatchSize() const override { return static_cast<int>(planes_.size()); }

  // Returns Q value of @sample.
  float GetQVal(int sample) const override { return q_values_[sample]; }

  // Returns P value @move_id of @sample.
  float GetPVal(int sample, int move_id) const override {
    return policies_[sample][move_id];
  }

 private:
  void EncodePlanes(const InputPlanes& sample, float* buffer);

  static constexpr int kNumOutputPolicies = 1858;

  static constexpr auto kWidth = 8;
  static constexpr auto kHeight = 8;
  static constexpr auto kSquares = kWidth * kHeight;

  const Weights& weights_;
  size_t max_batch_size_;
  std::vector<InputPlanes> planes_;
  std::vector<std::vector<float>> policies_;
  std::vector<float> q_values_;
};

class TSJSNetwork : public Network {
 public:
  TSJSNetwork(const Weights& weights, const OptionsDict& options);
  virtual ~TSJSNetwork(){};

  std::unique_ptr<NetworkComputation> NewComputation() override {
    return std::make_unique<TSJSComputation>(weights_, max_batch_size_);
  }

 private:
  // A cap on the max batch size since it consumes a lot of memory
  static constexpr auto kHardMaxBatchSize = 2048;

  Weights weights_;
  size_t max_batch_size_;
};

TSJSComputation::TSJSComputation(const Weights& weights,
                                 const size_t max_batch_size)
    : weights_(weights),
      max_batch_size_(max_batch_size),
      policies_(0),
      q_values_(0) {}

void TSJSComputation::ComputeBlocking() {

  // Determine the largest batch for allocations.
  const auto plane_count = planes_.size();
  const auto largest_batch_size = std::min(max_batch_size_, plane_count);
  
  // Allocate buffers for the whole batch.
  // kInputPlanes = 112
  // kNumOutputPolicies = 1858
  std::vector<float> in_buffer(largest_batch_size  * kSquares * kInputPlanes);
  std::vector<float> out_pol_buffer(largest_batch_size * kNumOutputPolicies);
  std::vector<float> out_val_buffer(largest_batch_size);
  
  for (size_t i = 0; i < plane_count; i += largest_batch_size) {
    const auto batch_size = std::min(plane_count - i, largest_batch_size);
    for (size_t j = 0; j < batch_size; j++) {
      EncodePlanes(planes_[i + j], in_buffer.data() + j * kSquares * kInputPlanes);
    }

#ifdef EMSCRIPTEN
    EM_ASM_( { lczero_forward($0, $1, $2, $3); } ,
            batch_size,
            (size_t) in_buffer.data(),
            (size_t) out_pol_buffer.data(),
            (size_t) out_val_buffer.data());
#endif

   auto pol_ptr=out_pol_buffer.data();
    for (size_t j = 0; j < batch_size; j++) {      
      std::vector<float> policy(kNumOutputPolicies);
      FullyConnectedLayer::Softmax(kNumOutputPolicies, pol_ptr, policy.data());
      //std::copy(pol_ptr, pol_ptr + kNumOutputPolicies, policy.begin());
      pol_ptr += kNumOutputPolicies;
    
      policies_.emplace_back(std::move(policy));
      auto winrate=out_val_buffer[j];
      q_values_.emplace_back(std::tanh(winrate));
    }
  }
}

void TSJSComputation::EncodePlanes(const InputPlanes& sample, float* buffer) {
  for (const InputPlane& plane : sample) {
    const float value = plane.value;
    for (auto i = 0; i < kSquares; i++)
      *(buffer++) = (plane.mask & (((uint64_t)1) << i)) != 0 ? value : 0;
  }
}

TSJSNetwork::TSJSNetwork(const Weights& weights, const OptionsDict& options)
    : weights_(weights) {
      max_batch_size_ =
      static_cast<size_t>(options.GetOrDefault<int>("batch_size", 256));
      
      if (max_batch_size_ > kHardMaxBatchSize) {
        max_batch_size_ = kHardMaxBatchSize;
      }
      fprintf(stderr, "TensorflowJS bridge, maximum batch size set to %ld.\n", max_batch_size_);
      
    }

REGISTER_NETWORK("tsjs", TSJSNetwork, 55)


}  // namespace lczero


