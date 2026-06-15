with open(r'C:\Users\vdako\thevault-final\.env.clerk', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('CLERK_SECRET_KEY'):
            key = line.split('=', 1)[1]
            print(f'Key length: {len(key)}')
            print(f'Key hex: {key.encode().hex()}')
            print(f'Key repr: {repr(key)}')
