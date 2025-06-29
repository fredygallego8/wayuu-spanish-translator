project(node_ffmpeg CXX)

cmake_minimum_required(VERSION 3.7)

find_package(PkgConfig)
pkg_check_modules(
    FFMPEG REQUIRED
    libavutil libavcodec libavformat
    libavdevice libavfilter libswscale
    libswresample libpostproc
)

if(DEFINED CMAKE_JS_VERSION)
list(APPEND NODE_FFMPEG_INCLUDE_DIRECTORIES ${CMAKE_JS_INC})
else()
list(APPEND NODE_FFMPEG_INCLUDE_DIRECTORIES ${CMAKE_CURRENT_SOURCE_DIR}/node_modules/nan)
list(APPEND NODE_FFMPEG_INCLUDE_DIRECTORIES $ENV{NODE_INSTALL_DIR}/include/node)
endif()

list(APPEND NODE_FFMPEG_INCLUDE_DIRECTORIES ${FFMPEG_INCLUDE_DIRS})

add_library(node_ffmpeg SHARED src/main.cpp src/FormatContext.cpp src/FormatContext.h src/TypeConverter.cpp src/TypeConverter.h src/ErrorUtility.cpp src/ErrorUtility.h src/Packet.cpp src/Packet.h src/Codec.cpp src/Codec.h src/CodecContext.cpp src/CodecContext.h src/Frame.cpp src/Frame.h src/Constants.cpp src/Constants.h src/CodecParameters.cpp src/CodecParameters.h src/Stream.cpp src/Stream.h src/Rational.cpp src/Rational.h)
target_link_libraries(
    node_ffmpeg PRIVATE
    ${FFMPEG_LIBRARIES} ${CMAKE_JS_LIB}
)
target_include_directories(
    node_ffmpeg PRIVATE
    ${NODE_FFMPEG_INCLUDE_DIRECTORIES}
)
target_compile_options(node_ffmpeg PRIVATE ${FFMPEG_CFLAGS})

if(DEFINED CMAKE_JS_VERSION)
set_target_properties(node_ffmpeg PROPERTIES PREFIX "" SUFFIX ".node")
endif()
