#!/bin/bash

cardano-cli transaction sign \
--signing-key-file payment.skey \
--signing-key-file policy/policy.skey \
--mainnet --tx-body-file matx.raw \
--out-file matx.signed
