BINARY_NAME = inthack
BUILD_DIR = bin
MAIN_FILE = main.go

# default target
.PHONY: all
all: build

# build the binary
.PHONY: build
build:
	@echo "🔨 Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_FILE)
	@echo "===Build complete: $(BUILD_DIR)/$(BINARY_NAME)==="
	@echo ""

# start (depends on build)
.PHONY: start
start: build
	@echo "===Starting $(BINARY_NAME)==="
	@echo ""
	@./$(BUILD_DIR)/$(BINARY_NAME) init

# clean the build directory
.PHONY: clean
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf $(BUILD_DIR)
	@echo "===Clean complete==="
	@echo ""
