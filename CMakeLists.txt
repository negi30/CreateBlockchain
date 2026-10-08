cmake_minimum_required(VERSION 3.10)
project(CreateBlockchain)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -Wno-deprecated-declarations")

# Find OpenSSL
find_package(OpenSSL REQUIRED)

# Include directories
include_directories(
    src/
    ${OPENSSL_INCLUDE_DIR}
)

# Source files
file(GLOB SOURCES "src/*.cpp")

# Executable
add_executable(blockchain_app ${SOURCES})

# Link libraries
target_link_libraries(blockchain_app OpenSSL::SSL OpenSSL::Crypto)
