# Mini Agent From Scratch

This project supports `lesson-003-agent-loop-from-scratch`.

It intentionally avoids agent frameworks. The point is to make the runtime loop visible:

```text
observe -> model decision -> tool call or final -> observation + trace -> continue or stop
```

Run tests:

```bash
python3 -m unittest discover -s projects/mini_agent/tests -p 'test_*.py'
```

Run learning scenarios:

```bash
python3 -m projects.mini_agent.cli --scenario calculator --json
python3 -m projects.mini_agent.cli --scenario coupon_good --json
python3 -m projects.mini_agent.cli --scenario coupon_bad --json
```

The code covers:

- happy path tool execution
- unknown tool
- bad arguments
- tool failure
- max iteration stop
- diagnostic downgrade from dataset inspection
