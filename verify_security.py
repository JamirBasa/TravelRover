#!/usr/bin/env python3
"""
Security Verification Script for TravelRover
Checks for exposed API keys and security misconfigurations
"""

import os
import re
import sys
from pathlib import Path

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_gitignore():
    """Verify .gitignore properly excludes .env files"""
    print(f"\n{BLUE}1. Checking .gitignore configuration...{RESET}")
    
    gitignore_path = Path(__file__).parent / '.gitignore'
    if not gitignore_path.exists():
        print(f"{RED}✗ .gitignore not found{RESET}")
        return False
    
    with open(gitignore_path, 'r') as f:
        content = f.read()
    
    required_patterns = ['.env', '*.env', '.env.local', 'travel-backend/.env']
    missing = []
    
    for pattern in required_patterns:
        if pattern not in content:
            missing.append(pattern)
    
    if missing:
        print(f"{RED}✗ Missing patterns in .gitignore: {', '.join(missing)}{RESET}")
        return False
    
    print(f"{GREEN}✓ .gitignore properly configured{RESET}")
    return True

def check_env_files_exist():
    """Check if example files exist and real .env files are present"""
    print(f"\n{BLUE}2. Checking environment file structure...{RESET}")
    
    base_path = Path(__file__).parent
    backend_path = base_path / 'travel-backend'
    
    checks = {
        '.env.example': base_path / '.env.example',
        'travel-backend/.env.example': backend_path / '.env.example',
        '.env.local (optional)': base_path / '.env.local',
        'travel-backend/.env': backend_path / '.env',
    }
    
    all_good = True
    for name, path in checks.items():
        if path.exists():
            print(f"{GREEN}✓ {name} exists{RESET}")
        else:
            if 'optional' in name:
                print(f"{YELLOW}⚠ {name} not found (optional){RESET}")
            else:
                print(f"{RED}✗ {name} missing{RESET}")
                all_good = False
    
    return all_good

def scan_for_hardcoded_keys(directory, extensions):
    """Scan for potential hardcoded API keys"""
    print(f"\n{BLUE}3. Scanning for hardcoded API keys in {directory}...{RESET}")
    
    base_path = Path(__file__).parent / directory
    if not base_path.exists():
        print(f"{YELLOW}⚠ Directory {directory} not found{RESET}")
        return True
    
    # Patterns that look like API keys
    patterns = [
        r'AIzaSy[A-Za-z0-9_-]{33}',  # Google API keys
        r'[0-9a-f]{64}',  # SerpAPI keys (64 hex chars)
        r'sk-[A-Za-z0-9]{48}',  # OpenAI-style keys
    ]
    
    findings = []
    
    for ext in extensions:
        for file_path in base_path.rglob(f'*.{ext}'):
            # Skip node_modules, venv, etc.
            if any(skip in str(file_path) for skip in ['node_modules', 'venv', 'dist', '__pycache__', '.git']):
                continue
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    for pattern in patterns:
                        matches = re.findall(pattern, content)
                        if matches:
                            # Filter out false positives (example strings, comments)
                            for match in matches:
                                if 'your_' not in content[max(0, content.find(match)-20):content.find(match)+len(match)+20].lower():
                                    if 'example' not in str(file_path).lower():
                                        findings.append((file_path, match[:20] + '...'))
            except Exception as e:
                pass  # Skip files that can't be read
    
    if findings:
        print(f"{RED}✗ Potential hardcoded keys found:{RESET}")
        for path, key in findings:
            print(f"  {path}: {key}")
        return False
    
    print(f"{GREEN}✓ No hardcoded keys found{RESET}")
    return True

def check_proxy_configuration():
    """Verify Gemini proxy is properly configured"""
    print(f"\n{BLUE}4. Checking Gemini proxy configuration...{RESET}")
    
    # Check backend proxy endpoint
    backend_views = Path(__file__).parent / 'travel-backend' / 'langgraph_agents' / 'views_gemini_proxy.py'
    if not backend_views.exists():
        print(f"{RED}✗ Backend proxy endpoint not found{RESET}")
        return False
    
    print(f"{GREEN}✓ Backend proxy endpoint exists{RESET}")
    
    # Check frontend proxy service
    frontend_service = Path(__file__).parent / 'src' / 'config' / 'geminiProxyService.jsx'
    if not frontend_service.exists():
        print(f"{RED}✗ Frontend proxy service not found{RESET}")
        return False
    
    print(f"{GREEN}✓ Frontend proxy service exists{RESET}")
    
    # Check aimodel.jsx configuration
    aimodel = Path(__file__).parent / 'src' / 'config' / 'aimodel.jsx'
    if aimodel.exists():
        with open(aimodel, 'r') as f:
            content = f.read()
            if 'USE_PROXY' in content and 'GeminiProxyChatSession' in content:
                print(f"{GREEN}✓ Frontend configured to use proxy{RESET}")
                return True
    
    print(f"{RED}✗ Frontend proxy configuration incomplete{RESET}")
    return False

def check_backend_env():
    """Verify backend .env has required keys"""
    print(f"\n{BLUE}5. Checking backend environment variables...{RESET}")
    
    env_path = Path(__file__).parent / 'travel-backend' / '.env'
    if not env_path.exists():
        print(f"{RED}✗ Backend .env not found{RESET}")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
    
    required_keys = [
        'SECRET_KEY',
        'GOOGLE_PLACES_API_KEY',
        'SERPAPI_KEY',
        'GOOGLE_GEMINI_AI_API_KEY',
    ]
    
    missing = []
    for key in required_keys:
        if key not in content:
            missing.append(key)
    
    if missing:
        print(f"{RED}✗ Missing required keys: {', '.join(missing)}{RESET}")
        return False
    
    print(f"{GREEN}✓ All required backend keys present{RESET}")
    return True

def main():
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}TravelRover Security Verification{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    results = []
    
    results.append(check_gitignore())
    results.append(check_env_files_exist())
    results.append(scan_for_hardcoded_keys('src', ['js', 'jsx', 'ts', 'tsx']))
    results.append(scan_for_hardcoded_keys('travel-backend', ['py']))
    results.append(check_proxy_configuration())
    results.append(check_backend_env())
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"{GREEN}✓ All security checks passed ({passed}/{total}){RESET}")
        print(f"{GREEN}Security Status: EXCELLENT ✅{RESET}")
        return 0
    else:
        print(f"{RED}✗ Some checks failed ({passed}/{total}){RESET}")
        print(f"{YELLOW}Security Status: NEEDS ATTENTION ⚠️{RESET}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
