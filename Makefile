# Compiler
CXX = g++

# Compiler Flags
CXXFLAGS = -std=c++11 -Wall -Wextra -Wno-deprecated-declarations

# Include directories
OPENSSL_PREFIX = $(shell brew --prefix openssl@3)
INCLUDES = -Isrc/ -I$(OPENSSL_PREFIX)/include/

# Libraries
LIBS = -L$(OPENSSL_PREFIX)/lib/ -lssl -lcrypto


# Source Files
SRC_DIR = src
SOURCES = $(wildcard $(SRC_DIR)/*.cpp)

# Object Files
OBJ_DIR = obj
OBJECTS = $(patsubst $(SRC_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SOURCES))

# Executable
EXEC = blockchain_app

# Targets
all: $(EXEC)

$(EXEC): $(OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

# Create the obj directory if it doesn't exist
$(OBJECTS): | $(OBJ_DIR)

$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

clean:
	rm -rf $(OBJ_DIR) $(EXEC)

.PHONY: all clean

