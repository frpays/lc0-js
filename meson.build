# This file is part of Leela Chess Zero.
# Copyright (C) 2018 The LCZero Authors
#
# Leela Chess is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Leela Chess is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Leela Chess.  If not, see <http://www.gnu.org/licenses/>.

project('lc0', 'cpp',
        default_options : ['cpp_std=c++14', 'b_ndebug=if-release'],
        meson_version: '>=0.45')

cc = meson.get_compiler('cpp')
if cc.get_id() == 'clang'
  # Thread safety annotation
  add_project_arguments('-Wthread-safety', language : 'cpp')
endif
if cc.get_id() == 'clang' or cc.get_id() == 'gcc'
  add_project_arguments('-Wextra', language : 'cpp')
  add_project_arguments('-pedantic', language : 'cpp')

  if get_option('buildtype') == 'release'
    add_project_arguments('-march=native', language : 'cpp')
  endif
endif

# Files to compile.
deps = []
files = []
includes = []
has_backends = false

# Both protobuf and protoc must be the same version, so couple them together.
protobuf_lib = cc.find_library('libprotobuf', dirs : get_option('protobuf_libdir'), required : false)
if not protobuf_lib.found()
  protobuf_dep = dependency('protobuf', required : false)
else
  protobuf_dep = protobuf_lib
endif
protoc = find_program('protoc', required : false)
if not protobuf_dep.found() or not protoc.found()
  deps += subproject('protobuf').get_variable('protobuf_dep')
  protoc = subproject('protobuf').get_variable('protoc')
else
  deps += protobuf_dep
  if protobuf_lib.found()
    includes += include_directories(get_option('protobuf_include'))
  endif
endif

gen = generator(protoc, output: ['@BASENAME@.pb.cc', '@BASENAME@.pb.h'],
  arguments : ['--proto_path=@CURRENT_SOURCE_DIR@/libs/lczero-common', '--cpp_out=@BUILD_DIR@', '@INPUT@'])

files += gen.process('libs/lczero-common/proto/net.proto',
  preserve_path_from : meson.current_source_dir() + '/libs/lczero-common/')

#############################################################################
## Main files
#############################################################################
files += [
  'src/engine.cc',
  'src/version.cc',
  'src/benchmark/benchmark.cc',
  'src/chess/bitboard.cc',
  'src/chess/board.cc',
  'src/chess/position.cc',
  'src/chess/uciloop.cc',
  'src/mcts/node.cc',
  'src/mcts/params.cc',
  'src/mcts/search.cc',
  'src/neural/cache.cc',
  'src/neural/encoder.cc',
  'src/neural/factory.cc',
  'src/neural/loader.cc',
  'src/neural/network_check.cc',
  'src/neural/network_random.cc',
  'src/neural/writer.cc',
  'src/syzygy/syzygy.cc',
  'src/utils/commandline.cc',
  'src/utils/configfile.cc',
  'src/utils/histogram.cc',
  'src/utils/logging.cc',
  'src/utils/optionsdict.cc',
  'src/utils/optionsparser.cc',
  'src/utils/random.cc',
  'src/utils/string.cc',
  'src/utils/transpose.cc',
]
includes += include_directories('src')


#############################################################################
## Platform specific files
############################################################################
if host_machine.system() == 'windows'
  files += 'src/utils/filesystem.win32.cc'
else
  files += 'src/utils/filesystem.posix.cc'
  deps += [
    cc.find_library('pthread'),
    ]
endif



#############################################################################
## BACKENDS
#############################################################################

blas_files = [
  'src/neural/blas/convolution1.cc',
  'src/neural/blas/network_blas.cc',
  'src/neural/blas/batchnorm.cc',
  'src/neural/blas/fully_connected_layer.cc',
  'src/neural/blas/winograd_convolution3.cc'
]

files += blas_files


#############################################################################
## Dependencies
#############################################################################
  ## ~~~~
  ## zlib
  ## ~~~~
  # Pick latest from https://wrapdb.mesonbuild.com/zlib and put into
  # subprojects/zlib.wrap
  deps += dependency('zlib', fallback: ['zlib', 'zlib_dep'])

  ## ~~~~~~~~
  ## Profiler
  ## ~~~~~~~~
  if get_option('buildtype') != 'release'
    deps += cc.find_library('libprofiler',
      dirs: ['/usr/local/lib'], required: false)
  endif


#############################################################################
## Main Executable
#############################################################################

if not get_option('popcnt')
  add_project_arguments('-DNO_POPCNT', language : 'cpp')
endif

executable('lc0', 'src/main.cc',
  files, include_directories: includes, dependencies: deps, install: true)


### Tests
gtest = dependency('gtest', fallback: ['gtest', 'gtest_dep'], required: false)

if get_option('gtest') and gtest.found()
  lc0_lib = library('lc0_lib', files, include_directories: includes, dependencies: deps)

  test('ChessBoard',
    executable('chessboard_test', 'src/chess/board_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), args: '--gtest_output=xml:chessboard.xml', timeout: 90)

  test('HashCat',
    executable('hashcat_test', 'src/utils/hashcat_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), args: '--gtest_output=xml:hashcat.xml', timeout: 90)

  test('PositionTest',
    executable('position_test', 'src/chess/position_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), args: '--gtest_output=xml:position.xml', timeout: 90)

  test('OptionsParserTest',
    executable('optionsparser_test', 'src/utils/optionsparser_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), timeout: 90)

  test('SyzygyTest',
    executable('syzygy_test', 'src/syzygy/syzygy_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), args: '--gtest_output=xml:syzygy.xml', timeout: 90)

  test('EncodePositionForNN', 
    executable('encoder_test', 'src/neural/encoder_test.cc',
    include_directories: includes, link_with: lc0_lib, dependencies: gtest
  ), args: '--gtest_output=xml:encoder.xml', timeout: 90)

endif
