# Push to GitHub (Private Repo)

The repo is initialized and committed. To push to GitHub as a private repo:

## Option 1: GitHub Web (recommended)

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `quantum-ring` (or `q-ring`)
3. **Visibility:** **Private**
4. Leave "Add a README" etc. unchecked (we already have files)
5. Click **Create repository**
6. Copy the clone URL (e.g. `https://github.com/YOUR_USERNAME/quantum-ring.git`)

Then run (replace with your URL):

```bash
cd /home/i4cdeath/Develop/quantum_ring
git remote add origin https://github.com/YOUR_USERNAME/quantum-ring.git
git push -u origin main
```

## Option 2: GitHub CLI

```bash
# Install (if needed)
sudo apt install gh
gh auth login

# Create private repo and push
cd /home/i4cdeath/Develop/quantum_ring
gh repo create quantum-ring --private --source=. --remote=origin --push
```
