#!/bin/bash

# Script to clean up unused dependencies and UI components
# Run this script to remove identified unused packages and files

set -e

echo "🧹 Para Connect - Dependency Cleanup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to prompt user
confirm() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Backup package.json
echo "📦 Creating backup of package.json..."
cp package.json package.json.backup
echo -e "${GREEN}✓ Backup created: package.json.backup${NC}"
echo ""

# Remove unused Radix UI packages
echo "🗑️  Removing unused Radix UI packages..."
if confirm "Remove 18 unused Radix UI packages (~270KB savings)?"; then
    npm uninstall \
        @radix-ui/react-accordion \
        @radix-ui/react-alert-dialog \
        @radix-ui/react-aspect-ratio \
        @radix-ui/react-checkbox \
        @radix-ui/react-collapsible \
        @radix-ui/react-context-menu \
        @radix-ui/react-dropdown-menu \
        @radix-ui/react-hover-card \
        @radix-ui/react-menubar \
        @radix-ui/react-navigation-menu \
        @radix-ui/react-popover \
        @radix-ui/react-radio-group \
        @radix-ui/react-scroll-area \
        @radix-ui/react-slider \
        @radix-ui/react-slot \
        @radix-ui/react-switch \
        @radix-ui/react-tabs \
        @radix-ui/react-toggle-group

    echo -e "${GREEN}✓ Unused Radix UI packages removed${NC}"
else
    echo -e "${YELLOW}⊘ Skipped Radix UI cleanup${NC}"
fi
echo ""

# Remove unused other packages
echo "📦 Checking for other unused dependencies..."

# Check if certain packages are actually used
UNUSED_PACKAGES=""

# Check for unused packages (add more as needed)
if ! grep -r "embla-carousel" src/ > /dev/null 2>&1; then
    UNUSED_PACKAGES="$UNUSED_PACKAGES embla-carousel-react"
fi

if ! grep -r "input-otp" src/ > /dev/null 2>&1; then
    UNUSED_PACKAGES="$UNUSED_PACKAGES input-otp"
fi

if ! grep -r "cmdk" src/ > /dev/null 2>&1; then
    UNUSED_PACKAGES="$UNUSED_PACKAGES cmdk"
fi

if ! grep -r "vaul" src/ > /dev/null 2>&1; then
    UNUSED_PACKAGES="$UNUSED_PACKAGES vaul"
fi

if ! grep -r "react-resizable-panels" src/ > /dev/null 2>&1; then
    UNUSED_PACKAGES="$UNUSED_PACKAGES react-resizable-panels"
fi

if [ -n "$UNUSED_PACKAGES" ]; then
    echo "Found potentially unused packages: $UNUSED_PACKAGES"
    if confirm "Remove these packages?"; then
        npm uninstall $UNUSED_PACKAGES
        echo -e "${GREEN}✓ Additional packages removed${NC}"
    else
        echo -e "${YELLOW}⊘ Skipped additional package cleanup${NC}"
    fi
else
    echo -e "${GREEN}✓ No additional unused packages found${NC}"
fi
echo ""

# Remove unused UI component files
echo "🗂️  Removing unused UI component files..."
if confirm "Remove 29 unused UI component files (~87KB savings)?"; then

    COMPONENTS_TO_REMOVE=(
        "src/components/ui/accordion.tsx"
        "src/components/ui/alert-dialog.tsx"
        "src/components/ui/aspect-ratio.tsx"
        "src/components/ui/breadcrumb.tsx"
        "src/components/ui/calendar.tsx"
        "src/components/ui/carousel.tsx"
        "src/components/ui/chart.tsx"
        "src/components/ui/checkbox.tsx"
        "src/components/ui/collapsible.tsx"
        "src/components/ui/command.tsx"
        "src/components/ui/context-menu.tsx"
        "src/components/ui/drawer.tsx"
        "src/components/ui/dropdown-menu.tsx"
        "src/components/ui/hover-card.tsx"
        "src/components/ui/input-otp.tsx"
        "src/components/ui/menubar.tsx"
        "src/components/ui/navigation-menu.tsx"
        "src/components/ui/pagination.tsx"
        "src/components/ui/popover.tsx"
        "src/components/ui/radio-group.tsx"
        "src/components/ui/resizable.tsx"
        "src/components/ui/scroll-area.tsx"
        "src/components/ui/sidebar.tsx"
        "src/components/ui/slider.tsx"
        "src/components/ui/switch.tsx"
        "src/components/ui/table.tsx"
        "src/components/ui/tabs.tsx"
        "src/components/ui/toggle-group.tsx"
    )

    for component in "${COMPONENTS_TO_REMOVE[@]}"; do
        if [ -f "$component" ]; then
            rm "$component"
            echo "  - Removed $component"
        fi
    done

    echo -e "${GREEN}✓ Unused UI components removed${NC}"
else
    echo -e "${YELLOW}⊘ Skipped UI component cleanup${NC}"
fi
echo ""

# Calculate savings
echo "💰 Estimated Savings Summary:"
echo "-----------------------------"
echo "  Radix UI packages: ~270 KB"
echo "  UI component files: ~87 KB"
echo "  Additional packages: varies"
echo "  Total estimated: ~360+ KB"
echo ""

# Clean up node_modules and reinstall
if confirm "Clean node_modules and reinstall for final optimization?"; then
    echo "🧹 Cleaning node_modules..."
    rm -rf node_modules

    echo "📦 Reinstalling dependencies..."
    npm install

    echo -e "${GREEN}✓ Dependencies reinstalled${NC}"
else
    echo -e "${YELLOW}⊘ Skipped node_modules cleanup${NC}"
fi
echo ""

echo "✨ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run build"
echo "2. Test the application thoroughly"
echo "3. Compare bundle sizes before/after"
echo "4. If issues occur, restore from package.json.backup"
echo ""
echo "To restore backup: mv package.json.backup package.json && npm install"