# Compiler
CXX = g++

# Compiler Flags
CXXFLAGS = -std=c++11 -Wall -Wextra

# Include directories (Empty because MSYS2 handles standard paths automatically)
INCLUDES = -Isrc/

# Libraries (Just the names, no hardcoded paths)
LIBS = -lssl -lcrypto

# Source Files
SRC_DIR = src
SOURCES = $(wildcard $(SRC_DIR)/*.cpp)

# Object Files
OBJ_DIR = obj
OBJECTS = $(patsubst $(SRC_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SOURCES))

# Executable (Adding .exe for Windows compatibility)
EXEC = blockchain_app.exe

# Targets
all: $(EXEC)

$(EXEC): $(OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $^ $(LIBS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp
	@mkdir -p $(OBJ_DIR)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

clean:
	rm -rf $(OBJ_DIR) $(EXEC)

.PHONY: all clean
